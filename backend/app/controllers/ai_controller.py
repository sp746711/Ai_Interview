from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.services.ai_service import AIService
from backend.app.services.question_bank_service import QuestionBankService
from bson import ObjectId
from pydantic import BaseModel
from typing import Any, Dict, Optional
import re


# =========================================================
# ROUND 3 — CSV QUESTION BANK
# =========================================================
# Round 3 questions are generated once per interview:
# Q1  = "Tell me about yourself."
# Q2-Q21 = 20 random questions from the selected domain CSV.
#
# The generated sequence is stored in MongoDB as
# "round3_questions" so it never changes during the interview.
# =========================================================


# =========================================================
# REQUEST MODELS
# =========================================================

class AIAnswerSubmit(BaseModel):
    interview_id: str
    question: str
    answer: str
    transcript: Optional[str] = None
    duration_seconds: Optional[float] = None
    communication_metrics: Optional[Dict[str, Any]] = None
    camera_metrics: Optional[Dict[str, Any]] = None


class AIReadinessSubmit(BaseModel):
    interview_id: str
    response: str = ""


class AISkipSubmit(BaseModel):
    interview_id: str
    question: str


# =========================================================
# CONTROLLER
# =========================================================

class AIController:

    # =====================================================
    # COMMON HELPERS
    # =====================================================

    @staticmethod
    def _normalize_text(value: str) -> str:
        text = str(value or "").strip().lower()

        text = re.sub(r"[^\w\s']", " ", text)
        text = re.sub(r"\s+", " ", text)

        return text.strip()

    @staticmethod
    async def _get_interview(
        interview_id: str,
        db: AsyncIOMotorDatabase
    ):
        try:
            oid = ObjectId(interview_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid interview id"
            )

        interview = await db["interviews"].find_one(
            {"_id": oid}
        )

        if not interview:
            raise HTTPException(
                status_code=404,
                detail="Interview not found"
            )

        if interview.get("stage") != "ai":
            raise HTTPException(
                status_code=409,
                detail="AI interview stage is not active"
            )

        return oid, interview

    # =====================================================
    # ROUND 3 QUESTION SEQUENCE
    # =====================================================

    @staticmethod
    async def _get_or_create_round3_questions(
        oid: ObjectId,
        interview: dict,
        db: AsyncIOMotorDatabase,
    ):
        """
        Return the stored Round 3 question sequence.

        The sequence contains exactly 21 questions:
        - Q1: fixed introduction question.
        - Q2-Q21: 20 random questions from the selected domain CSV.

        In addition to the frontend-safe question text, the complete
        question evaluation metadata is stored in MongoDB under
        ``round3_question_data``. This lets the evaluator use the CSV
        reference answer, key points, and evaluation criteria without
        exposing those fields to the frontend.
        """

        stored_questions = interview.get("round3_questions", [])
        stored_question_data = interview.get("round3_question_data", [])

        valid_questions = (
            isinstance(stored_questions, list)
            and len(stored_questions) == 21
            and all(
                isinstance(question, str) and question.strip()
                for question in stored_questions
            )
        )

        valid_question_data = (
            isinstance(stored_question_data, list)
            and len(stored_question_data) == 21
            and all(
                isinstance(item, dict)
                and str(item.get("question", "")).strip()
                for item in stored_question_data
            )
        )

        # Existing interviews may already have the 21-question sequence
        # but not the new metadata. Preserve that exact sequence and
        # reconstruct only the missing metadata instead of reshuffling.
        if valid_questions and not valid_question_data:
            resume_data = interview.get("resume_data", {})
            if not isinstance(resume_data, dict):
                resume_data = {}

            selected_domain = str(
                interview.get(
                    "role",
                    resume_data.get(
                        "selected_domain",
                        interview.get("interview_type", ""),
                    ),
                )
                or ""
            ).strip()

            if not selected_domain:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Interview domain is missing. Please select "
                        "a target role / domain."
                    ),
                )

            try:
                csv_records = QuestionBankService.load_question_records(
                    selected_domain
                )
                record_by_question = {
                    str(record.get("question", "")).strip(): record
                    for record in csv_records
                    if str(record.get("question", "")).strip()
                }

                question_data = []
                for index, question in enumerate(stored_questions):
                    if index == 0 and question.strip() == QuestionBankService.INTRODUCTION_QUESTION:
                        record = QuestionBankService.get_introduction_record(
                            selected_domain
                        )
                    else:
                        record = record_by_question.get(question.strip())

                    if not record:
                        # The stored sequence cannot be evaluated safely
                        # if its CSV metadata can no longer be found.
                        raise ValueError(
                            f"Evaluation metadata not found for question: {question}"
                        )

                    question_data.append(record)

                await db["interviews"].update_one(
                    {"_id": oid},
                    {
                        "$set": {
                            "round3_question_data": question_data,
                            "round3_total_questions": len(stored_questions),
                        }
                    },
                )

                return stored_questions

            except (ValueError, FileNotFoundError) as exc:
                raise HTTPException(
                    status_code=500,
                    detail=(
                        "Unable to restore Round 3 question evaluation "
                        f"metadata: {str(exc)}"
                    ),
                )

        if valid_questions and valid_question_data:
            return stored_questions

        resume_data = interview.get("resume_data", {})
        if not isinstance(resume_data, dict):
            resume_data = {}

        selected_domain = str(
            interview.get(
                "role",
                resume_data.get(
                    "selected_domain",
                    interview.get("interview_type", ""),
                ),
            )
            or ""
        ).strip()

        if not selected_domain:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Interview domain is missing. Please select "
                    "a target role / domain."
                ),
            )

        try:
            generated_records = QuestionBankService.create_interview_question_records(
                domain=selected_domain,
                question_count=20,
            )
        except (ValueError, FileNotFoundError) as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    "Unable to load the interview question bank: "
                    f"{str(exc)}"
                ),
            )

        generated_questions = [
            str(record.get("question", "")).strip()
            for record in generated_records
        ]

        if len(generated_questions) != 21 or any(
            not question for question in generated_questions
        ):
            raise HTTPException(
                status_code=500,
                detail="Question bank did not produce exactly 21 valid questions.",
            )

        # Store the question text and its private evaluation metadata
        # together. The question text is used by the interview UI;
        # question_data is used by the backend evaluator.
        claim_result = await db["interviews"].update_one(
            {
                "_id": oid,
                "round3_questions": {"$exists": False},
            },
            {
                "$set": {
                    "round3_questions": generated_questions,
                    "round3_question_data": generated_records,
                    "round3_total_questions": len(generated_questions),
                }
            },
        )

        if claim_result.modified_count == 1:
            return generated_questions

        # Another request created the sequence first. Always use the
        # stored sequence and metadata rather than the newly generated
        # random sequence.
        latest_interview = await db["interviews"].find_one(
            {"_id": oid},
            {
                "round3_questions": 1,
                "round3_question_data": 1,
            },
        )

        latest_questions = (
            latest_interview.get("round3_questions", [])
            if latest_interview
            else []
        )
        latest_question_data = (
            latest_interview.get("round3_question_data", [])
            if latest_interview
            else []
        )

        if (
            isinstance(latest_questions, list)
            and len(latest_questions) == 21
            and all(
                isinstance(question, str) and question.strip()
                for question in latest_questions
            )
            and isinstance(latest_question_data, list)
            and len(latest_question_data) == 21
        ):
            return latest_questions

        raise HTTPException(
            status_code=500,
            detail="Unable to initialize the Round 3 question sequence.",
        )

    @staticmethod
    async def _get_round3_question_data(
        interview: dict,
        index: int,
    ) -> Dict[str, Any]:
        """Return the private evaluation metadata for one Round 3 question."""

        question_data = interview.get("round3_question_data", [])

        if (
            isinstance(question_data, list)
            and 0 <= index < len(question_data)
            and isinstance(question_data[index], dict)
        ):
            return question_data[index]

        # Q1 always has a known evaluation context even for older records.
        if index == 0:
            resume_data = interview.get("resume_data", {})
            if not isinstance(resume_data, dict):
                resume_data = {}

            selected_domain = str(
                interview.get(
                    "role",
                    resume_data.get(
                        "selected_domain",
                        interview.get("interview_type", ""),
                    ),
                )
                or ""
            ).strip()

            return QuestionBankService.get_introduction_record(
                selected_domain
            )

        return {}

    # =====================================================
    # READY RESPONSE DETECTION
    # =====================================================

    @staticmethod
    def _is_ready(response: str) -> bool:
        text = AIController._normalize_text(response)

        if not text:
            return False

        # Explicit negative responses first.
        not_ready = [
            "not yet",
            "not ready",
            "wait",
            "wait a moment",
            "wait a minute",
            "give me a moment",
            "give me a minute",
            "one moment",
            "one minute",
            "hold on",
            "hold on a moment",
            "hold on a minute",
            "just a second",
            "just a moment",
            "please wait",
            "not now",
            "no",
            "nope",
        ]

        if any(item in text for item in not_ready):
            return False

        ready = [
            "yes",
            "yes im ready",
            "yes i am ready",
            "i am ready",
            "im ready",
            "ready",
            "lets start",
            "let's start",
            "start",
            "okay start",
            "ok start",
            "okay lets start",
            "okay let's start",
            "sure",
            "sure lets start",
            "sure let's start",
            "ready for the interview",
            "ready to start",
            "ready to begin",
        ]

        return any(item in text for item in ready)

    # =====================================================
    # FINAL ROUND READINESS
    # =====================================================

    @staticmethod
    async def check_readiness(
        data: AIReadinessSubmit,
        db: AsyncIOMotorDatabase
    ):
        oid, interview = await AIController._get_interview(
            data.interview_id,
            db
        )

        state = interview.get(
            "round3_state",
            "waiting_for_ready"
        )

        if state == "completed":
            return {
                "ready": False,
                "state": "completed",
                "message": "The interview has already been completed."
            }

        if state == "interview_active":
            return {
                "ready": True,
                "state": "interview_active",
                "message": "The interview has already started."
            }

        response = AIController._normalize_text(
            data.response
        )

        # -------------------------------------------------
        # READY
        # -------------------------------------------------

        if AIController._is_ready(response):

            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round3_state": "interview_active",
                        "round3_ready": True,
                        "current_question_index": 0,
                    }
                }
            )

            return {
                "ready": True,
                "state": "interview_active",
                "message": (
                    "Okay, now let's start the interview. "
                    "Good luck!"
                )
            }

        # -------------------------------------------------
        # NOT READY / SILENCE / UNCLEAR
        # -------------------------------------------------

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "round3_state": "waiting_for_ready",
                    "round3_ready": False,
                },
                "$inc": {
                    "round3_readiness_attempts": 1
                }
            }
        )

        return {
            "ready": False,
            "state": "waiting_for_ready",
            "message": (
                "No problem. Take your time. "
                "Let me know when you are ready."
            )
        }

    # =====================================================
    # GET QUESTION
    # =====================================================

    @staticmethod
    async def get_question(
        interview_id: str,
        db: AsyncIOMotorDatabase
    ):
        oid, interview = await AIController._get_interview(
            interview_id,
            db
        )

        state = interview.get(
            "round3_state",
            "waiting_for_ready"
        )

        # -------------------------------------------------
        # Initialize the interview state if this is the first
        # request for Round 3.
        # -------------------------------------------------
        if "round3_state" not in interview:
            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round3_state": "waiting_for_ready",
                        "round3_ready": False,
                        "current_question_index": 0,
                    }
                }
            )

            state = "waiting_for_ready"

        # -------------------------------------------------
        # Create/load the fixed 21-question sequence.
        # This happens before ACTIVE handling so it also works
        # when readiness has already changed the state to active.
        # -------------------------------------------------
        questions = await AIController._get_or_create_round3_questions(
            oid,
            interview,
            db,
        )

        total_questions = len(questions)

        # Keep the total synchronized with the actual stored sequence.
        if interview.get("round3_total_questions") != total_questions:
            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round3_total_questions": total_questions,
                    }
                }
            )

        # -------------------------------------------------
        # NOT READY
        # -------------------------------------------------

        if state == "waiting_for_ready":
            return {
                "state": "waiting_for_ready",
                "ready": False,
                "question": None,
                "message": "Are you ready for the interview?",
                "total_questions": total_questions,
            }

        # -------------------------------------------------
        # COMPLETED
        # -------------------------------------------------

        if state == "completed":
            return {
                "state": "completed",
                "ready": False,
                "question": None,
                "message": "The interview has been completed.",
                "total_questions": total_questions,
            }

        # -------------------------------------------------
        # ACTIVE
        # -------------------------------------------------

        index = int(
            interview.get(
                "current_question_index",
                0
            )
        )

        if index >= total_questions:
            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round3_state": "completed",
                        "round3_ready": False,
                    }
                }
            )

            return {
                "state": "completed",
                "ready": False,
                "question": None,
                "message": "The interview has been completed.",
                "total_questions": total_questions,
            }

        question = questions[index]
        question_data = await AIController._get_round3_question_data(
            interview,
            index,
        )

        return {
            "state": "interview_active",
            "ready": True,
            "question_number": index + 1,
            "total_questions": total_questions,
            "question": question,
            "question_id": question_data.get("question_id"),
            "question_type": question_data.get("question_type", "csv"),
            "type": interview.get(
                "interview_type",
                "technical"
            ),
        }

    # =====================================================
    # SUBMIT ANSWER
    # =====================================================

    @staticmethod
    async def submit_answer(
        data: AIAnswerSubmit,
        db: AsyncIOMotorDatabase
    ):
        oid, interview = await AIController._get_interview(
            data.interview_id,
            db
        )

        if interview.get("round3_state") != "interview_active":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Interview is not active. "
                    "Complete the readiness step first."
                )
            )

        questions = await AIController._get_or_create_round3_questions(
            oid,
            interview,
            db,
        )

        total_questions = len(questions)

        index = int(
            interview.get(
                "current_question_index",
                0
            )
        )

        if index >= total_questions:
            raise HTTPException(
                status_code=409,
                detail="All interview questions are completed."
            )

        expected_question = questions[index]

        if str(data.question).strip() != expected_question:
            raise HTTPException(
                status_code=409,
                detail="Question does not match the current interview question."
            )

        answer = str(data.answer or "").strip()

        if not answer:
            raise HTTPException(
                status_code=400,
                detail="Voice answer cannot be empty."
            )

        question_data = await AIController._get_round3_question_data(
            interview,
            index,
        )

        evaluation = AIService.evaluate_answer(
            expected_question,
            answer,
            interview.get("resume_data", {}),
            transcript=str(data.transcript or ""),
            duration_seconds=data.duration_seconds,
            question_context=question_data,
        )

        response_model = {
            "question_number": index + 1,
            "question": expected_question,
            "question_id": question_data.get("question_id"),
            "question_type": question_data.get("question_type", "csv"),
            "answer": answer,
            "score": evaluation["normalized_score"],
            "score_10": evaluation["score"],
            "feedback": evaluation["feedback"],
            # Server-generated Round 3 analytics.
            # These values come from AIService.evaluate_answer()
            # and are stored so Round3FeedbackService can aggregate
            # them later for the final feedback page.
            "answer_quality": evaluation.get("answer_quality"),
            "communication": evaluation.get("communication"),
            "status": "answered",
        }

        # -------------------------------------------------
        # Optional Round 3 analytics data
        # -------------------------------------------------
        # These fields are stored only when the frontend actually
        # provides them. No fake/default analytics are created here.
        if data.transcript is not None:
            response_model["transcript"] = str(data.transcript).strip()

        if data.duration_seconds is not None:
            try:
                duration = float(data.duration_seconds)
                if duration >= 0:
                    response_model["duration_seconds"] = duration
            except (TypeError, ValueError):
                pass

        if isinstance(data.communication_metrics, dict):
            response_model["communication_metrics"] = dict(
                data.communication_metrics
            )

        if isinstance(data.camera_metrics, dict):
            response_model["camera_metrics"] = dict(
                data.camera_metrics
            )

        next_index = index + 1

        update_fields = {
            "current_question_index": next_index
        }

        if next_index >= total_questions:
            update_fields["round3_state"] = "completed"
            update_fields["round3_ready"] = False

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$push": {
                    "responses": response_model
                },
                "$set": update_fields
            }
        )

        return {
            "message": "Answer recorded.",
            "question_number": index + 1,
            "next_question_number": (
                next_index + 1
                if next_index < total_questions
                else None
            ),
            "total_questions": total_questions,
            "completed": (
                next_index >= total_questions
            ),
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "state": (
                "completed"
                if next_index >= total_questions
                else "interview_active"
            ),
        }

    # =====================================================
    # SKIP QUESTION
    # =====================================================

    @staticmethod
    async def skip_question(
        data: AISkipSubmit,
        db: AsyncIOMotorDatabase
    ):
        oid, interview = await AIController._get_interview(
            data.interview_id,
            db
        )

        if interview.get("round3_state") != "interview_active":
            raise HTTPException(
                status_code=409,
                detail="Interview is not active."
            )

        questions = await AIController._get_or_create_round3_questions(
            oid,
            interview,
            db,
        )

        total_questions = len(questions)

        index = int(
            interview.get(
                "current_question_index",
                0
            )
        )

        if index >= total_questions:
            raise HTTPException(
                status_code=409,
                detail="Interview already completed."
            )

        expected_question = questions[index]

        if str(data.question).strip() != expected_question:
            raise HTTPException(
                status_code=409,
                detail="Question does not match the current interview question."
            )

        next_index = index + 1

        update_fields = {
            "current_question_index": next_index,
        }

        if next_index >= total_questions:
            update_fields["round3_state"] = "completed"
            update_fields["round3_ready"] = False

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$push": {
                    "responses": {
                        "question_number": index + 1,
                        "question": expected_question,
                        "answer": "",
                        "score": 0,
                        "score_10": 0,
                        "feedback": "Question skipped.",
                        "status": "skipped",
                    }
                },
                "$set": update_fields
            }
        )

        return {
            "message": "Question skipped.",
            "completed": (
                next_index >= total_questions
            ),
            "next_question_number": (
                next_index + 1
                if next_index < total_questions
                else None
            ),
            "total_questions": total_questions,
        }

