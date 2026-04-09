from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.services.ai_service import AIService
from bson import ObjectId
from pydantic import BaseModel

class AIAnswerSubmit(BaseModel):
    interview_id: str
    question: str
    answer: str

class AIController:
    @staticmethod
    async def get_question(interview_id: str, db: AsyncIOMotorDatabase):
        try:
            oid = ObjectId(interview_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid interview id")

        interview = await db["interviews"].find_one({"_id": oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.get("stage") != "ai":
            raise HTTPException(status_code=409, detail="AI interview stage is not active")

        resume_data = interview.get("resume_data", {})
        role = interview.get("role") or "Software Engineer"
        interview_type = interview.get("interview_type", "technical")
        difficulty = interview.get("difficulty", "easy")
        asked = [resp.get("question", "") for resp in interview.get("responses", []) if resp.get("question")]
        generated = AIService.generate_questions(
            interview_type=interview_type,
            resume_data=resume_data,
            role=role,
            difficulty=difficulty,
            asked_questions=asked,
            count=1,
        )
        next_q = generated["questions"][0]
        return next_q

    @staticmethod
    async def submit_answer(data: AIAnswerSubmit, db: AsyncIOMotorDatabase):
        try:
            oid = ObjectId(data.interview_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid interview id")

        interview = await db["interviews"].find_one({"_id": oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.get("stage") != "ai":
            raise HTTPException(status_code=409, detail="AI interview stage is not active")

        evaluation = AIService.evaluate_answer(data.question, data.answer, interview.get("resume_data", {}))
        response_model = {
            "question": data.question,
            "answer": data.answer,
            "score": evaluation["normalized_score"],
            "score_10": evaluation["score"],
            "feedback": evaluation["feedback"],
        }
        
        await db["interviews"].update_one(
            {"_id": oid},
            {"$push": {"responses": response_model}}
        )

        return {
            "message": "Answer recorded",
            "score": evaluation["score"],
            "feedback": evaluation["feedback"],
        }

