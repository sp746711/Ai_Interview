from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.test_schema import TestSubmit
from backend.app.services.scoring_service import ScoringService
from bson import ObjectId

class TestController:
    @staticmethod
    def _safe_lower(value, default: str) -> str:
        if value is None:
            return default
        return str(value).strip().lower() or default

    @staticmethod
    async def get_questions(interview_type: str, difficulty: str, db: AsyncIOMotorDatabase):
        interview_type_v = TestController._safe_lower(interview_type, "technical")
        difficulty_v = TestController._safe_lower(difficulty, "easy")
        cursor = db["tests"].find(
            {"interview_type": interview_type_v, "difficulty": difficulty_v}
        ).limit(10)
        questions = await cursor.to_list(length=5)
        if not questions:
            cursor = db["tests"].find({"difficulty": difficulty_v}).limit(10)
            questions = await cursor.to_list(length=10)

        for q in questions:
            q["id"] = str(q["_id"])
            del q["_id"]
            if "correct_answer" in q:
                del q["correct_answer"]
        return {"questions": questions}

    @staticmethod
    async def submit_test(data: TestSubmit, db: AsyncIOMotorDatabase):
        try:
            oid = ObjectId(data.interview_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid interview id")

        interview = await db["interviews"].find_one({"_id": oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.get("stage") != "test":
            raise HTTPException(status_code=409, detail="Test stage is not active")

        interview_type = TestController._safe_lower(interview.get("interview_type"), "technical")
        difficulty = TestController._safe_lower(interview.get("difficulty"), "easy")

        cursor = db["tests"].find(
            {"interview_type": interview_type, "difficulty": difficulty}
        )
        questions = await cursor.to_list(length=100)

        safe_answers = {}
        for k, v in (data.answers or {}).items():
            safe_answers[str(k)] = "" if v is None else str(v)

        result = ScoringService.evaluate_test(safe_answers, questions)
        score_percent = int((result["score"] / result["total"]) * 100) if result["total"] > 0 else 0

        await db["interviews"].update_one(
            {"_id": oid},
            {"$set": {"test_score": score_percent, "test_answers": safe_answers, "stage": "setup"}}
        )

        return {"score": score_percent, "message": "Test submitted successfully"}

