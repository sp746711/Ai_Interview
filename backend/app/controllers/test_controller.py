from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.test_schema import TestSubmit
from bson import ObjectId


class TestController:

    @staticmethod
    def _safe_lower(value, default: str) -> str:
        if value is None:
            return default
        return str(value).strip().lower() or default

    @staticmethod
    async def get_questions(interview_type: str, db: AsyncIOMotorDatabase):

        aptitude = await db["aptitude_questions"].aggregate([
            {"$sample": {"size": 5}}
        ]).to_list(length=5)

        reasoning = await db["reasoning_questions"].aggregate([
            {"$sample": {"size": 5}}
        ]).to_list(length=5)

        if interview_type.lower() == "technical":
            main_questions = await db["tests"].aggregate([
                {"$sample": {"size": 10}}
            ]).to_list(length=10)
        else:
            main_questions = await db["verbal_questions"].aggregate([
                {"$sample": {"size": 10}}
            ]).to_list(length=10)

        questions = aptitude + reasoning + main_questions

        for q in questions:
            q["mongo_id"] = str(q["_id"])
            del q["_id"]

            if "answer" in q:
                del q["answer"]

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

        safe_answers = {}

        for k, v in (data.answers or {}).items():
            safe_answers[str(k)] = "" if v is None else str(v)

        await db["interviews"].update_one(
            {"_id": oid},
            {
                "$set": {
                    "test_answers": safe_answers,
                    "stage": "setup"
                }
            }
        )

        return {
            "message": "Test submitted successfully"
        }