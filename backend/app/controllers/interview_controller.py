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

        valid_ai_scores = []

        for response in ai_responses:

            if not isinstance(response, dict):
                continue

            try:
                score = float(
                    response.get("score", 0) or 0
                )

                valid_ai_scores.append(score)

            except (TypeError, ValueError):
                continue

        ai_s = (
            sum(valid_ai_scores)
            / len(valid_ai_scores)

            if valid_ai_scores

            else 0
        )

        ai_s = int(round(ai_s))

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

        # Strengths from real category percentages
        strengths = []

        for key, label in feedback_categories:
            category_data = category_scores.get(
                key,
                {}
            )

            if not isinstance(category_data, dict):
                continue

            percentage = category_data.get("percentage")

            if percentage is None:
                continue

            try:
                percentage = int(percentage)
            except (TypeError, ValueError):
                continue

            if percentage >= 70:
                strengths.append(f"Strong {label}")

        if not strengths and round2_result:
            strengths.append(
                "Consistent assessment attempt"
            )

        # Areas to improve from real category percentages
        weaknesses = []

        for key, label in feedback_categories:
            category_data = category_scores.get(
                key,
                {}
            )

            if not isinstance(category_data, dict):
                continue

            percentage = category_data.get("percentage")

            if percentage is None:
                continue

            try:
                percentage = int(percentage)
            except (TypeError, ValueError):
                continue

            if percentage < 70:
                weaknesses.append(f"{label} Concepts")

        if (
            not weaknesses
            and round2_result
            and test_s < 80
        ):
            weaknesses.append(
                "Advanced Problem Solving"
            )

        # Rule-based Task 16 recommendations for now.
        # LLM recommendations can be added later.
        suggestions = []

        for key, label in feedback_categories:
            category_data = category_scores.get(
                key,
                {}
            )

            if not isinstance(category_data, dict):
                continue

            percentage = category_data.get("percentage")

            if percentage is None:
                continue

            try:
                percentage = int(percentage)
            except (TypeError, ValueError):
                continue

            if percentage < 70:
                suggestions.append(
                    f"Practice more {label.lower()} questions."
                )

        if test_s < 80:
            suggestions.append(
                "Improve speed and accuracy through timed mock tests."
            )

        if not suggestions and round2_result:
            suggestions.append(
                "Continue practicing to maintain your assessment performance."
            )

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