import asyncio
import time
import json

from bson import ObjectId
from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.models.interview_model import InterviewModel
from backend.app.schemas.interview_schema import InterviewSetup, InterviewStart
from backend.app.services.resume_service import ResumeService
from backend.app.services.scoring_service import ScoringService
from backend.app.services.resume_intelligence_service import (
    analyze_resume_with_llm,
)
from backend.app.services.test_feedback_service import (
    generate_test_feedback,
)
from backend.app.services.round3_feedback_service import (
    Round3FeedbackService,
)


class InterviewController:

    # =========================================================
    # OBJECT ID HELPER
    # =========================================================

    @staticmethod
    def _parse_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid interview id",
            )

    # =========================================================
    # BACKGROUND ROUND 1 QWEN ANALYSIS
    # =========================================================

    @staticmethod
    async def _generate_round1_feedback(
        interview_id: str,
        db: AsyncIOMotorDatabase,
    ):
        """
        Generate detailed Round 1 feedback in the background.

        IMPORTANT:
        - Does NOT block Round 1.
        - Does NOT block Round 2.
        - Does NOT block Round 3.
        - Does NOT block GET /result.
        - Successful result is cached in MongoDB.
        """

        try:
            oid = ObjectId(interview_id)

            interview = await db["interviews"].find_one(
                {"_id": oid}
            )

            if not interview:
                return

            resume_data = interview.get("resume_data", {})

            if not isinstance(resume_data, dict):
                resume_data = {}

            # -------------------------------------------------
            # Existing feedback guard
            # -------------------------------------------------
            # Keep an existing result only when it belongs to the
            # same selected domain. If the user selected a new
            # domain, regenerate the Round 1 analysis for that
            # domain.

            existing_feedback = resume_data.get(
                "round1_feedback",
                {},
            )

            existing_domain = ""
            if isinstance(existing_feedback, dict):
                existing_domain = str(
                    existing_feedback.get(
                        "analysis_domain",
                        existing_feedback.get(
                            "selected_domain",
                            "",
                        ),
                    )
                    or ""
                ).strip().lower()

            # -------------------------------------------------
            # Decide selected domain BEFORE checking the cache
            # -------------------------------------------------

            selected_domain = str(
                interview.get(
                    "role",
                    resume_data.get(
                        "selected_domain",
                        interview.get(
                            "interview_type",
                            "technical",
                        ),
                    ),
                )
                or ""
            ).strip()

            if (
                isinstance(existing_feedback, dict)
                and existing_feedback
                and not existing_feedback.get("generation_error")
                and existing_domain
                and existing_domain == selected_domain.lower()
            ):
                return

            # -------------------------------------------------
            # Resume information
            # -------------------------------------------------

            resume_text = str(
                resume_data.get("resume_text", "")
            ).strip()

            detected_skills = resume_data.get(
                "skills",
                [],
            )

            if not isinstance(detected_skills, list):
                detected_skills = []

            # -------------------------------------------------
            # Final domain used by the LLM
            # -------------------------------------------------
            # The selected Round 3/setup role has priority over the
            # original interview type. This makes the analysis
            # dynamic for Data Analyst, ML Engineer, Software
            # Engineer, etc.

            selected_domain_for_feedback = (
                selected_domain
                or str(
                    resume_data.get(
                        "selected_domain",
                        interview.get(
                            "interview_type",
                            "technical",
                        ),
                    )
                    or "technical"
                ).strip()
            )

            # -------------------------------------------------
            # Resume text missing
            # -------------------------------------------------

            if not resume_text:
                feedback = {
                    "selected_domain":
                        selected_domain_for_feedback,

                    "analysis_domain":
                        selected_domain_for_feedback,

                    "domain_match_percentage": 0,

                    "best_fit_roles": [],

                    "matching_skills": [],

                    "missing_or_weak_evidence": [],

                    "personalized_improvements": [],

                    "resume_summary": (
                        "Detailed resume feedback could not "
                        "be generated because the stored "
                        "resume text is unavailable."
                    ),
                }

                await db["interviews"].update_one(
                    {"_id": oid},
                    {
                        "$set": {
                            "resume_data.round1_feedback":
                                feedback,

                            "resume_data.feedback_status":
                                "completed",

                            "resume_data.feedback_error":
                                None,
                        }
                    },
                )

                return

            # -------------------------------------------------
            # Mark LLM processing
            # -------------------------------------------------

            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "resume_data.feedback_status":
                            "processing",

                        "resume_data.feedback_error":
                            None,
                    }
                },
            )

            # -------------------------------------------------
            # DOMAIN-SPECIFIC LLM ANALYSIS
            # -------------------------------------------------

            feedback = await analyze_resume_with_llm(
                resume_text=resume_text,
                selected_domain=selected_domain_for_feedback,
                detected_skills=detected_skills,
            )

            if not isinstance(feedback, dict):
                raise RuntimeError(
                    "Invalid response returned by resume AI."
                )

            # -------------------------------------------------
            # Normalize the LLM result with the actual domain used
            # -------------------------------------------------
            feedback["selected_domain"] = (
                feedback.get("selected_domain")
                or selected_domain_for_feedback
            )
            feedback["analysis_domain"] = (
                selected_domain_for_feedback
            )

            # -------------------------------------------------
            # Save complete successful LLM result
            # -------------------------------------------------

            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "resume_data.round1_feedback":
                            feedback,

                        "resume_data.feedback_status":
                            "completed",

                        "resume_data.feedback_error":
                            None,
                    }
                },
            )

        except Exception as exc:

            # -------------------------------------------------
            # Background failure must not break interview flow
            # -------------------------------------------------

            try:
                oid = ObjectId(interview_id)

                await db["interviews"].update_one(
                    {"_id": oid},
                    {
                        "$set": {
                            "resume_data.feedback_status":
                                "failed",

                            "resume_data.feedback_error":
                                str(exc),
                        }
                    },
                )

            except Exception:
                pass

    # =========================================================
    # START INTERVIEW
    # =========================================================

    @staticmethod
    async def start_interview(
        user_id: str,
        data: InterviewStart,
        db: AsyncIOMotorDatabase,
    ):
        interview_type = str(
            data.interview_type or "technical"
        ).strip().lower()

        new_interview = InterviewModel(
            user_id=user_id,
            stage="round1",
            interview_type=interview_type,
        )

        result = await db["interviews"].insert_one(
            new_interview.model_dump()
        )

        return {
            "interview_id": str(result.inserted_id),
            "message": "Interview started successfully",
        }

    # =========================================================
    # ROUND 1 — RESUME SCREENING
    # =========================================================

    @staticmethod
    async def round1(
        interview_id: str,
        interview_type: str,
        file: UploadFile,
        db: AsyncIOMotorDatabase,
    ):
        oid = InterviewController._parse_object_id(
            interview_id
        )

        interview = await db["interviews"].find_one(
            {"_id": oid}
        )

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found",
            )

        if interview.get("stage") != "round1":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Round 1 already completed "
                    "or invalid stage"
                ),
            )

        # =====================================================
        # FAST RESUME PROCESSING
        # =====================================================
        #
        # ResumeService:
        # - extracts PDF text
        # - calculates ATS score
        # - detects skills
        #
        # Qwen should NOT block this request.
        # =====================================================

        try:
            resume_result = await ResumeService.process_resume(
                file,
                interview_type,
            )

        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=f"Resume analysis failed: {str(exc)}",
            )

        # =====================================================
        # STORE ROUND 1 DATA
        # =====================================================

        resume_data = {
            "score": resume_result.get(
                "score",
                0,
            ),

            "skills": resume_result.get(
                "skills",
                [],
            ),

            "resume_text": resume_result.get(
                "resume_text",
                "",
            ),

            "selected_domain": resume_result.get(
                "selected_domain",
                interview_type,
            ),

            "round1_feedback": {},

            "feedback_status": "pending",

            "feedback_error": None,
        }

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "interview_type": str(
                        interview_type or "technical"
                    ).strip().lower(),

                    "resume_data": resume_data,

                    "stage": "test",
                }
            },
        )

        # =====================================================
        # DO NOT RUN DOMAIN-SPECIFIC LLM ANALYSIS HERE
        # =====================================================
        #
        # At this point the resume is processed, but the user may
        # not have selected the final target role/domain yet.
        # The detailed Round 1 LLM analysis is therefore started
        # after the role/domain is saved in setup().
        # =====================================================

        # =====================================================
        # RETURN ATS + SKILLS IMMEDIATELY
        # =====================================================

        return {
            "message": "Round 1 complete",

            "resume_score":
                resume_data["score"],

            "skills_extracted":
                resume_data["skills"],

            "feedback_status":
                "pending",

            "stage": "test",
        }

    # =========================================================
    # ROUND 3 — AI INTERVIEW SETUP
    # =========================================================

    @staticmethod
    async def setup(
        data: InterviewSetup,
        db: AsyncIOMotorDatabase,
    ):
        oid = InterviewController._parse_object_id(
            data.interview_id
        )

        interview = await db["interviews"].find_one(
            {"_id": oid}
        )

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found",
            )

        if interview.get("stage") != "setup":
            raise HTTPException(
                status_code=409,
                detail="Complete test before setup",
            )

        role = str(
            data.role or ""
        ).strip()

        if not role:
            raise HTTPException(
                status_code=400,
                detail="Please select a target role / domain",
            )

        # =====================================================
        # SAVE THE ACTUAL TARGET DOMAIN
        # =====================================================
        #
        # Round 1 resume processing already happened. Now the
        # selected domain/role is known, so this is the correct
        # point to run the detailed LLM analysis.
        # =====================================================

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "role": role,
                    "stage": "ai",
                    "resume_data.selected_domain": role,
                    "resume_data.feedback_status": "processing",
                    "resume_data.feedback_error": None,
                },

                "$unset": {
                    "difficulty": "",
                    "duration": "",
                },
            },
        )

        # =====================================================
        # START DOMAIN-SPECIFIC LLM ANALYSIS IN BACKGROUND
        # =====================================================
        #
        # The user can continue into the AI interview immediately.
        # The generated Round 1 analysis is cached in MongoDB and
        # is later displayed by the final feedback page.
        # =====================================================

        asyncio.create_task(
            InterviewController._generate_round1_feedback(
                data.interview_id,
                db,
            )
        )

        return {
            "message": "AI Interview setup complete",
            "role": role,
            "stage": "ai",
            "feedback_status": "processing",
        }

    # =========================================================
    # TASK 16 — ROUND 2 LLM FEEDBACK
    # =========================================================
    # TASK 16 ONLY.
    #
    # Uses the REAL saved round2_result and sends it to the
    # existing Task 16 LLM service. Nothing here changes Round 2
    # scoring, timing, questions, Round 1, Round 3, or UI.
    # =========================================================

    @staticmethod
    async def _generate_round2_llm_feedback(
        interview_id: str,
        db: AsyncIOMotorDatabase,
    ):
        try:
            oid = InterviewController._parse_object_id(
                interview_id
            )

            interview = await db["interviews"].find_one(
                {"_id": oid}
            )

            if not interview:
                return None

            round2_result = interview.get(
                "round2_result",
                {},
            )

            if not isinstance(round2_result, dict):
                round2_result = {}

            if not round2_result:
                return None

            interview_type_value = str(
                interview.get(
                    "interview_type",
                    "technical",
                )
                or "technical"
            ).strip().lower()

            # Generate feedback from the REAL Round 2 result.
            llm_feedback = await generate_test_feedback(
                round2_result=round2_result,
                interview_type=interview_type_value,
            )

            if not isinstance(llm_feedback, dict):
                raise RuntimeError(
                    "Invalid response returned by Task 16 LLM service."
                )

            task16_result = dict(llm_feedback)

            # Keep the existing frontend-compatible field names.
            strengths = task16_result.get(
                "strengths",
                [],
            )

            weaknesses = task16_result.get(
                "weaknesses",
                task16_result.get(
                    "areas_to_improve",
                    [],
                ),
            )

            recommendations = task16_result.get(
                "recommendations",
                task16_result.get(
                    "suggestions",
                    [],
                ),
            )

            summary = task16_result.get(
                "assessment_summary",
                "",
            )

            if not isinstance(strengths, list):
                strengths = []

            if not isinstance(weaknesses, list):
                weaknesses = []

            if not isinstance(recommendations, list):
                recommendations = []

            task16_result["strengths"] = strengths[:5]
            task16_result["weaknesses"] = weaknesses[:5]
            task16_result["suggestions"] = recommendations[:5]
            task16_result["recommendations"] = recommendations[:5]
            task16_result["assessment_summary"] = (
                str(summary or "").strip()
            )
            task16_result["llm_finished_at"] = time.time()

            # Remove the nested started-at field before replacing
            # the complete Task 16 object. This avoids MongoDB
            # parent/child update-path conflicts.
            task16_result.pop(
                "llm_started_at",
                None,
            )

            status = str(
                task16_result.get(
                    "llm_status",
                    "error",
                )
                or "error"
            ).strip().lower()

            if status not in {
                "success",
                "error",
            }:
                status = "error"

            task16_result["llm_status"] = status

            # ONE $set only for the complete Task 16 object.
            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round2_result.task16_ai_feedback":
                            task16_result,
                    }
                },
            )

            print(
                "TASK 16 LLM RESULT SAVED:",
                {
                    "interview_id": interview_id,
                    "status": status,
                    "strengths": len(strengths),
                    "weaknesses": len(weaknesses),
                    "recommendations": len(
                        recommendations
                    ),
                },
            )

            return task16_result

        except Exception as exc:
            print(
                "TASK 16 LLM ERROR:",
                interview_id,
                str(exc),
            )

            # Always move Task 16 out of "processing" on failure.
            try:
                oid = InterviewController._parse_object_id(
                    interview_id
                )

                error_feedback = {
                    "strengths": [],
                    "weaknesses": [],
                    "suggestions": [],
                    "recommendations": [],
                    "assessment_summary": "",
                    "llm_status": "error",
                    "llm_error": str(exc),
                    "llm_finished_at": time.time(),
                }

                await db["interviews"].update_one(
                    {"_id": oid},
                    {
                        "$set": {
                            "round2_result.task16_ai_feedback":
                                error_feedback,
                        }
                    },
                )

                return error_feedback

            except Exception as save_error:
                print(
                    "TASK 16 ERROR SAVE FAILED:",
                    interview_id,
                    str(save_error),
                )

                return {
                    "strengths": [],
                    "weaknesses": [],
                    "suggestions": [],
                    "recommendations": [],
                    "assessment_summary": "",
                    "llm_status": "error",
                    "llm_error": str(exc),
                }

    # =========================================================
    # FINAL RESULT
    # =========================================================
    #
    # IMPORTANT:
    #
    # GET /result NEVER runs Qwen.
    #
    # It only reads already stored Round 1 feedback.
    # Therefore feedback-page loading remains fast.
    # =========================================================

    @staticmethod
    async def get_result(
        interview_id: str,
        db: AsyncIOMotorDatabase,
    ):
        oid = InterviewController._parse_object_id(
            interview_id
        )

        interview = await db["interviews"].find_one(
            {"_id": oid}
        )

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found",
            )

        # =====================================================
        # ROUND 1
        # =====================================================

        resume_data = interview.get(
            "resume_data",
            {},
        )

        if not isinstance(resume_data, dict):
            resume_data = {}

        try:
            resume_s = int(
                resume_data.get("score", 0) or 0
            )

        except (TypeError, ValueError):
            resume_s = 0

        resume_skills = resume_data.get(
            "skills",
            [],
        )

        if not isinstance(resume_skills, list):
            resume_skills = []

        round1_feedback = resume_data.get(
            "round1_feedback",
            {},
        )

        if not isinstance(round1_feedback, dict):
            round1_feedback = {}

        feedback_status = resume_data.get(
            "feedback_status",
            "pending",
        )

        feedback_error = resume_data.get(
            "feedback_error",
        )

        # =====================================================
        # ROUND 2
        # =====================================================

        try:
            test_s = int(
                interview.get("test_score", 0) or 0
            )

        except (TypeError, ValueError):
            test_s = 0

        # =====================================================
        # ROUND 3
        # =====================================================

        ai_responses = interview.get(
            "responses",
            [],
        )

        if not isinstance(ai_responses, list):
            ai_responses = []

        # =====================================================
        # TASK 18 — ROUND 3 BASIC RESULT SUMMARY
        # =====================================================
        # This object is consumed by the existing Round 3 feedback UI.
        # It is built only from the real saved Round 3 responses.
        # The question count is dynamic; it is never hardcoded to 5.

        round3_total_questions = interview.get(
            "round3_total_questions"
        )

        try:
            round3_total_questions = int(
                round3_total_questions
            )
        except (TypeError, ValueError):
            round3_total_questions = 0

        answered_count = 0
        skipped_count = 0
        answered_scores = []

        for response in ai_responses:

            if not isinstance(response, dict):
                continue

            status = str(
                response.get("status", "") or ""
            ).strip().lower()

            if status == "answered":
                answered_count += 1

                try:
                    response_score = float(
                        response.get("score", 0) or 0
                    )
                    answered_scores.append(response_score)
                except (TypeError, ValueError):
                    pass

            elif status == "skipped":
                skipped_count += 1

        # Older interviews may not have round3_total_questions.
        # Derive the count from the saved question numbers instead.
        if round3_total_questions <= 0:
            question_numbers = []

            for response in ai_responses:

                if not isinstance(response, dict):
                    continue

                try:
                    question_numbers.append(
                        int(response.get("question_number"))
                    )
                except (TypeError, ValueError):
                    continue

            round3_total_questions = (
                max(question_numbers)
                if question_numbers
                else len(ai_responses)
            )

        round3_average_score = (
            int(
                round(
                    sum(answered_scores)
                    / len(answered_scores)
                )
            )
            if answered_scores
            else 0
        )

        # Round 3 overall score must use answered questions only.
        # Skipped responses must never contribute their default score.
        ai_s = round3_average_score

        # =====================================================
        # TASK 18 — ROUND 3 DETERMINISTIC ANALYTICS
        # =====================================================
        # Preserve the existing Step 1 score/statistics logic above.
        # Add the real analytics generated from the saved responses.
        # This does not call Ollama/Qwen.
        # =====================================================

        round3_analytics = Round3FeedbackService.generate_feedback(
            ai_responses
        )

        if not isinstance(round3_analytics, dict):
            round3_analytics = {}

        # =====================================================
        # STEP 5 — ROUND 3 QWEN QUALITATIVE FEEDBACK
        # =====================================================
        # Qwen receives the candidate's REAL answered responses and the
        # deterministic analytics calculated above. No predefined
        # strengths, weaknesses, improvements, coaching, or summary are
        # created here. If Qwen fails, the qualitative fields remain
        # empty and the failure is explicitly returned.
        # =====================================================

        stored_round3_qualitative = interview.get(
            "round3_qualitative_feedback",
            {},
        )

        if not isinstance(stored_round3_qualitative, dict):
            stored_round3_qualitative = {}

        qualitative_status = str(
            stored_round3_qualitative.get(
                "llm_status",
                "",
            )
            or ""
        ).strip().lower()

        qualitative_started_at = stored_round3_qualitative.get(
            "llm_started_at",
            0,
        )

        try:
            qualitative_started_at = float(
                qualitative_started_at or 0
            )
        except (TypeError, ValueError):
            qualitative_started_at = 0

        qualitative_stale = (
            qualitative_status == "processing"
            and qualitative_started_at > 0
            and (time.time() - qualitative_started_at) > 240
        )

        should_generate_round3_qualitative = (
            answered_count > 0
            and (
                qualitative_status not in {
                    "success",
                    "processing",
                }
                or qualitative_stale
            )
        )

        if should_generate_round3_qualitative:
            now = time.time()

            claim_filter = {
                "_id": oid,
            }

            if qualitative_stale:
                claim_filter[
                    "round3_qualitative_feedback.llm_status"
                ] = "processing"
                claim_filter[
                    "round3_qualitative_feedback.llm_started_at"
                ] = qualitative_started_at
            else:
                claim_filter[
                    "round3_qualitative_feedback.llm_status"
                ] = {
                    "$nin": [
                        "success",
                        "processing",
                    ]
                }

            claim_result = await db["interviews"].update_one(
                claim_filter,
                {
                    "$set": {
                        "round3_qualitative_feedback.llm_status":
                            "processing",
                        "round3_qualitative_feedback.llm_error":
                            None,
                        "round3_qualitative_feedback.llm_started_at":
                            now,
                    }
                },
            )

            if claim_result.modified_count == 1:
                print(
                    "TASK 18 STEP 5: generating qualitative Round 3 feedback",
                    {
                        "interview_id": str(interview["_id"]),
                        "answered": answered_count,
                        "skipped": skipped_count,
                    },
                )

                qualitative_result = await Round3FeedbackService.generate_qualitative_feedback(
                    responses=ai_responses,
                    analytics=round3_analytics,
                    role=interview.get("role"),
                    interview_type=interview.get(
                        "interview_type",
                        "technical",
                    ),
                )

                if not isinstance(qualitative_result, dict):
                    qualitative_result = {
                        "strengths": [],
                        "weaknesses": [],
                        "improvements": [],
                        "coaching": [],
                        "summary": "",
                        "llm_status": "error",
                        "llm_error": "Invalid qualitative feedback result.",
                        "generation_source": "qwen3:4b",
                    }

                qualitative_result["llm_started_at"] = now
                qualitative_result["llm_finished_at"] = time.time()
                qualitative_result.pop("llm_started_at_persisted", None)

                await db["interviews"].update_one(
                    {"_id": oid},
                    {
                        "$set": {
                            "round3_qualitative_feedback": qualitative_result,
                        }
                    },
                )

                stored_round3_qualitative = qualitative_result
                qualitative_status = str(
                    qualitative_result.get(
                        "llm_status",
                        "error",
                    )
                    or "error"
                ).strip().lower()

            else:
                # Another request owns the active generation. Keep the
                # response empty until that generation is persisted.
                stored_round3_qualitative = {
                    "strengths": [],
                    "weaknesses": [],
                    "improvements": [],
                    "coaching": [],
                    "summary": "",
                    "llm_status": "processing",
                    "llm_error": None,
                    "generation_source": "qwen3:4b",
                }
                qualitative_status = "processing"

        # Normalize only the LLM-produced fields. Do not synthesize any
        # qualitative content when Qwen has not successfully returned it.
        round3_strengths = stored_round3_qualitative.get(
            "strengths",
            [],
        )
        round3_weaknesses = stored_round3_qualitative.get(
            "weaknesses",
            [],
        )
        round3_improvements = stored_round3_qualitative.get(
            "improvements",
            stored_round3_qualitative.get(
                "areas_to_improve",
                [],
            ),
        )
        round3_coaching = stored_round3_qualitative.get(
            "coaching",
            stored_round3_qualitative.get(
                "recommendations",
                [],
            ),
        )
        round3_summary = stored_round3_qualitative.get(
            "summary",
            stored_round3_qualitative.get(
                "final_summary",
                stored_round3_qualitative.get(
                    "assessment_summary",
                    "",
                ),
            ),
        )

        if not isinstance(round3_strengths, list):
            round3_strengths = []
        if not isinstance(round3_weaknesses, list):
            round3_weaknesses = []
        if not isinstance(round3_improvements, list):
            round3_improvements = []
        if not isinstance(round3_coaching, list):
            round3_coaching = []
        if not isinstance(round3_summary, str):
            round3_summary = str(round3_summary or "")

        round3_result = {
            "overall_score": ai_s,
            "interview_score": ai_s,
            "total_questions": round3_total_questions,
            "answered_questions": answered_count,
            "skipped_questions": skipped_count,
            "average_score": round3_average_score,

            # Step 5 — real Qwen-generated qualitative feedback.
            "strengths": round3_strengths[:5],
            "weaknesses": round3_weaknesses[:5],
            "improvements": round3_improvements[:5],
            "coaching": round3_coaching[:5],
            "summary": round3_summary,
            "qualitative_feedback": stored_round3_qualitative,
            "qualitative_status": qualitative_status or "",

            # Real deterministic Round 3 analytics.
            "answer_quality": round3_analytics.get(
                "answer_quality",
                {},
            ),
            "communication": round3_analytics.get(
                "communication",
                {},
            ),
            "camera_engagement": round3_analytics.get(
                "camera_engagement",
                {},
            ),
            "interview_presence": round3_analytics.get(
                "interview_presence",
                {},
            ),
        }

        # =====================================================
        # FINAL SCORE
        # =====================================================

        final_score = (
            ScoringService.calculate_final_score(
                resume_s,
                test_s,
                ai_s,
            )
        )

        try:
            final_score = int(final_score)

        except (TypeError, ValueError):
            final_score = 0

        # =====================================================
        # SAVE FINAL SCORES
        # =====================================================

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "interview_score": ai_s,
                    "final_score": final_score,
                    "stage": "feedback",
                }
            },
        )

        # =====================================================
        # RESULT RESPONSE
        # =====================================================

        # =================================================
        # TASK 16 — ROUND 2 FEEDBACK DATA
        # =================================================
        # Task 16 only: use the REAL saved Round 2 result.
        # Do not change Round 2 scoring, timing or questions.
        # =================================================

        round2_result = interview.get(
            "round2_result",
            {},
        )

        if not isinstance(round2_result, dict):
            round2_result = {}

        task16_ai_feedback = round2_result.get(
            "task16_ai_feedback",
            {},
        )

        if not isinstance(task16_ai_feedback, dict):
            task16_ai_feedback = {}

        llm_status = str(
            task16_ai_feedback.get(
                "llm_status",
                "",
            ) or ""
        ).strip().lower()

        started_at = task16_ai_feedback.get(
            "llm_started_at",
            0,
        )

        try:
            started_at = float(started_at or 0)
        except (TypeError, ValueError):
            started_at = 0

        # If a background worker died/restarted, allow Task 16 to
        # recover after 180 seconds. A fresh processing job is never
        # duplicated by a browser reload.
        stale_processing = (
            llm_status == "processing"
            and started_at > 0
            and (time.time() - started_at) > 180
        )

        should_start = (
            round2_result
            and (
                llm_status not in {"success", "processing"}
                or stale_processing
            )
        )

        if should_start:
            now = time.time()

            claim_filter = {
                "_id": oid,
            }

            if stale_processing:
                claim_filter[
                    "round2_result.task16_ai_feedback.llm_status"
                ] = "processing"
                claim_filter[
                    "round2_result.task16_ai_feedback.llm_started_at"
                ] = started_at
            else:
                claim_filter[
                    "round2_result.task16_ai_feedback.llm_status"
                ] = {
                    "$nin": ["success", "processing"]
                }

            claim_result = await db["interviews"].update_one(
                claim_filter,
                {
                    "$set": {
                        "round2_result.task16_ai_feedback.llm_status":
                            "processing",
                        "round2_result.task16_ai_feedback.llm_error":
                            None,
                        "round2_result.task16_ai_feedback.llm_started_at":
                            now,
                    }
                },
            )

            if claim_result.modified_count == 1:
                task16_ai_feedback = dict(task16_ai_feedback)
                task16_ai_feedback["llm_status"] = "processing"
                task16_ai_feedback["llm_error"] = None
                task16_ai_feedback["llm_started_at"] = now

                asyncio.create_task(
                    InterviewController._generate_round2_llm_feedback(
                        str(interview["_id"]),
                        db,
                    )
                )

        # Task 16 cards come ONLY from the stored LLM result.
        # While processing, leave them empty rather than showing the
        # old rule-based/static values.
        if llm_status == "success":
            strengths = task16_ai_feedback.get(
                "strengths",
                [],
            )
            weaknesses = task16_ai_feedback.get(
                "weaknesses",
                task16_ai_feedback.get("areas_to_improve", []),
            )
            suggestions = task16_ai_feedback.get(
                "recommendations",
                task16_ai_feedback.get("suggestions", []),
            )
            assessment_summary = task16_ai_feedback.get(
                "assessment_summary",
                "",
            )
        else:
            strengths = []
            weaknesses = []
            suggestions = []
            assessment_summary = (
                "AI feedback is being generated from your actual Round 2 performance."
                if llm_status == "processing"
                else ""
            )

        if not isinstance(strengths, list):
            strengths = []
        if not isinstance(weaknesses, list):
            weaknesses = []
        if not isinstance(suggestions, list):
            suggestions = []
        if not isinstance(assessment_summary, str):
            assessment_summary = str(assessment_summary or "")

        category_scores = round2_result.get(
            "category_scores",
            {}
        )

        if not isinstance(category_scores, dict):
            category_scores = {}

        # Technical:
        #   Reasoning + Aptitude + Technical
        #
        # Non-Technical:
        #   Reasoning + Aptitude + Verbal Ability

        interview_type_value = str(
            interview.get(
                "interview_type",
                "technical"
            ) or "technical"
        ).strip().lower()

        if interview_type_value == "non-technical":
            feedback_categories = [
                ("reasoning", "Reasoning"),
                ("aptitude", "Aptitude"),
                ("verbal", "Verbal Ability"),
            ]
        else:
            feedback_categories = [
                ("reasoning", "Reasoning"),
                ("aptitude", "Aptitude"),
                ("technical", "Technical"),
            ]

        # =========================================================
        # TASK 16 — USE ONLY STORED LLM FEEDBACK
        # =========================================================
        # IMPORTANT:
        # The Task 16 LLM result above is the single source of truth
        # for strengths, weaknesses, recommendations, and summary.
        # Do NOT overwrite those values with old rule-based/static
        # feedback. Round 2 scoring and category_scores remain
        # untouched and are returned through round2_result.
        # =========================================================

        if llm_status == "success":
            strengths = task16_ai_feedback.get(
                "strengths",
                [],
            )
            weaknesses = task16_ai_feedback.get(
                "weaknesses",
                task16_ai_feedback.get(
                    "areas_to_improve",
                    [],
                ),
            )
            suggestions = task16_ai_feedback.get(
                "recommendations",
                task16_ai_feedback.get(
                    "suggestions",
                    [],
                ),
            )
            assessment_summary = task16_ai_feedback.get(
                "assessment_summary",
                "",
            )
        elif llm_status == "processing":
            strengths = []
            weaknesses = []
            suggestions = []
            assessment_summary = (
                "AI feedback is being generated from your actual Round 2 performance."
            )
        else:
            strengths = []
            weaknesses = []
            suggestions = []
            assessment_summary = ""

        # Normalize the response fields without generating any
        # predefined candidate feedback. The LLM service is responsible
        # for deriving these items from the user's actual performance.
        if not isinstance(strengths, list):
            strengths = []
        if not isinstance(weaknesses, list):
            weaknesses = []
        if not isinstance(suggestions, list):
            suggestions = []
        if not isinstance(assessment_summary, str):
            assessment_summary = str(assessment_summary or "")

        # Keep the frontend-compatible maximum of five items.
        strengths = strengths[:5]
        weaknesses = weaknesses[:5]
        suggestions = suggestions[:5]

        return {
            "id": str(interview["_id"]),

            "user_id": interview.get(
                "user_id"
            ),

            "interview_type": interview.get(
                "interview_type",
                "technical",
            ),

            "role": interview.get(
                "role"
            ),

            "difficulty": interview.get(
                "difficulty"
            ),

            "duration": interview.get(
                "duration"
            ),

            # =================================================
            # ROUND 1
            # =================================================

            "resume_score":
                resume_s,

            "resume_skills":
                resume_skills,

            "round1_feedback":
                round1_feedback,

            "round1_feedback_status":
                feedback_status,

            "round1_feedback_error":
                feedback_error,

            # =================================================
            # ROUND 2
            # =================================================

            "test_score":
                test_s,

            "round2_result":
                interview.get("round2_result", {}),

            # =================================================
            # ROUND 3
            # =================================================

            "interview_score":
                ai_s,

            "round3_result":
                round3_result,

            # =================================================
            # FINAL
            # =================================================

            "final_score":
                final_score,

            # =================================================
            # TASK 16 — ROUND 2
            # =================================================

            "test_score":
                test_s,

            "round2_result":
                dict(round2_result, task16_ai_feedback=task16_ai_feedback),

            "strengths":
                strengths,

            "weaknesses":
                weaknesses,

            "suggestions":
                suggestions,

            "recommendations":
                suggestions,

            "assessment_summary":
                assessment_summary,

            "llm_status":
                llm_status,

            # =================================================
            }

    # =========================================================
    # GET CURRENT INTERVIEW STAGE
    # =========================================================

    @staticmethod
    async def get_stage(
        interview_id: str,
        user_id: str,
        db: AsyncIOMotorDatabase,
    ):
        oid = InterviewController._parse_object_id(
            interview_id
        )

        interview = await db["interviews"].find_one(
            {
                "_id": oid,
                "user_id": user_id,
            }
        )

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found",
            )

        return {
            "interview_id":
                interview_id,

            "stage": interview.get(
                "stage",
                "round1",
            ),

            "interview_type": interview.get(
                "interview_type",
                "technical",
            ),

            "role": interview.get(
                "role"
            ),
        }

    # =========================================================
    # INTERVIEW HISTORY
    # =========================================================

    @staticmethod
    async def get_history(
        user_id: str,
        db: AsyncIOMotorDatabase,
    ):
        cursor = (
            db["interviews"]
            .find(
                {
                    "user_id":
                        user_id
                }
            )
            .sort(
                "created_at",
                -1,
            )
        )

        docs = await cursor.to_list(
            length=200
        )

        history = []

        for item in docs:

            try:
                final_score = int(
                    item.get(
                        "final_score",
                        0,
                    ) or 0
                )

            except (TypeError, ValueError):
                final_score = 0

            history.append(
                {
                    "id": str(
                        item["_id"]
                    ),

                    "date": item.get(
                        "created_at"
                    ),

                    "role": (
                        item.get("role")
                        or item.get(
                            "interview_type",
                            "technical",
                        )
                    ),

                    "difficulty":
                        item.get(
                            "difficulty"
                        ),

                    "final_score":
                        final_score,

                    "stage": item.get(
                        "stage",
                        "round1",
                    ),
                }
            )

        scores = [
            item["final_score"]
            for item in history
        ]

        total = len(history)

        avg_score = (
            round(
                sum(scores) / total,
                1,
            )
            if total
            else 0
        )

        best_score = (
            max(scores)
            if scores
            else 0
        )

        return {
            "total": total,
            "avg_score": avg_score,
            "best_score": best_score,
            "history": history,
        }