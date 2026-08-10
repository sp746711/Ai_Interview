from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.services.ai_service import AIService
from bson import ObjectId
from pydantic import BaseModel
import re


# =========================================================
# ROUND 3 — FIVE DEMO QUESTIONS
# =========================================================

DEMO_QUESTIONS = [
    "Tell me about yourself and your experience related to this role.",
    "How have you used your technical skills in one of your projects?",
    "Describe a challenging project you have worked on and how you overcame the difficulties.",
    "How do you approach debugging a problem when your first solution does not work?",
    "Why are you a good fit for this role, and what would you like to contribute to the team?",
]


# =========================================================
# REQUEST MODELS
# =========================================================

class AIAnswerSubmit(BaseModel):
    interview_id: str
    question: str
    answer: str


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

        # First entry into Final Round.
        if "round3_state" not in interview:
            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round3_state": "waiting_for_ready",
                        "round3_ready": False,
                        "current_question_index": 0,
                        "round3_total_questions": len(
                            DEMO_QUESTIONS
                        ),
                    }
                }
            )

            state = "waiting_for_ready"

        # -------------------------------------------------
        # NOT READY
        # -------------------------------------------------

        if state == "waiting_for_ready":
            return {
                "state": "waiting_for_ready",
                "ready": False,
                "question": None,
                "message": "Are you ready for the interview?",
                "total_questions": len(DEMO_QUESTIONS),
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
                "total_questions": len(DEMO_QUESTIONS),
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

        if index >= len(DEMO_QUESTIONS):
            await db["interviews"].update_one(
                {"_id": oid},
                {
                    "$set": {
                        "round3_state": "completed"
                    }
                }
            )

            return {
                "state": "completed",
                "ready": False,
                "question": None,
                "message": "The interview has been completed.",
                "total_questions": len(DEMO_QUESTIONS),
            }

        question = DEMO_QUESTIONS[index]

        return {
            "state": "interview_active",
            "ready": True,
            "question_number": index + 1,
            "total_questions": len(DEMO_QUESTIONS),
            "question": question,
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

        index = int(
            interview.get(
                "current_question_index",
                0
            )
        )

        if index >= len(DEMO_QUESTIONS):
            raise HTTPException(
                status_code=409,
                detail="All interview questions are completed."
            )

        expected_question = DEMO_QUESTIONS[index]

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

        evaluation = AIService.evaluate_answer(
            expected_question,
            answer,
            interview.get("resume_data", {})
        )

        response_model = {
            "question_number": index + 1,
            "question": expected_question,
            "answer": answer,
            "score": evaluation["normalized_score"],
            "score_10": evaluation["score"],
            "feedback": evaluation["feedback"],
            "status": "answered",
        }

        next_index = index + 1

        update_fields = {
            "current_question_index": next_index
        }

        if next_index >= len(DEMO_QUESTIONS):
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
                if next_index < len(DEMO_QUESTIONS)
                else None
            ),
            "total_questions": len(DEMO_QUESTIONS),
            "completed": (
                next_index >= len(DEMO_QUESTIONS)
            ),
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
            "state": (
                "completed"
                if next_index >= len(DEMO_QUESTIONS)
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

        index = int(
            interview.get(
                "current_question_index",
                0
            )
        )

        if index >= len(DEMO_QUESTIONS):
            raise HTTPException(
                status_code=409,
                detail="Interview already completed."
            )

        expected_question = DEMO_QUESTIONS[index]

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
                "$set": {
                    "current_question_index": index + 1,
                }
            }
        )

        next_index = index + 1

        if next_index >= len(DEMO_QUESTIONS):
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
            "message": "Question skipped.",
            "completed": (
                next_index >= len(DEMO_QUESTIONS)
            ),
            "next_question_number": (
                next_index + 1
                if next_index < len(DEMO_QUESTIONS)
                else None
            ),
        }