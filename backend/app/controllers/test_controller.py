from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.test_schema import TestSubmit
from app.services.scoring_service import ScoringService
from bson import ObjectId

class TestController:
    @staticmethod
    async def get_questions(role: str, difficulty: str, db: AsyncIOMotorDatabase):
        cursor = db["test_questions"].find({"role": role, "difficulty": difficulty}).limit(5)
        questions = await cursor.to_list(length=5)
        for q in questions:
            q["id"] = str(q["_id"])
            del q["_id"]
            del q["correct_answer"]
        return questions

    @staticmethod
    async def submit_test(data: TestSubmit, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(data.interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
            
        cursor = db["test_questions"].find({"role": interview["role"], "difficulty": interview["difficulty"]})
        questions = await cursor.to_list(length=100)
        
        result = ScoringService.evaluate_test(data.answers, questions)
        score_percent = int((result["score"] / result["total"]) * 100) if result["total"] > 0 else 0
        
        test_data = {"score": score_percent, "answers": data.answers}
        await db["interviews"].update_one(
            {"_id": ObjectId(data.interview_id)},
            {"$set": {"test": test_data}}
        )
        
        return {"score": score_percent, "message": "Test submitted successfully"}
