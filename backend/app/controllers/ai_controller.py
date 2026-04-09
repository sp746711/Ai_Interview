from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.services.ai_service import AIService
from app.services.scoring_service import ScoringService
from bson import ObjectId
from pydantic import BaseModel

class AIAnswerSubmit(BaseModel):
    interview_id: str
    question: str
    answer: str

class AIController:
    @staticmethod
    async def get_question(interview_id: str, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
            
        question = AIService.generate_question(interview["role"], interview["difficulty"])
        return {"question": question}

    @staticmethod
    async def submit_answer(data: AIAnswerSubmit, db: AsyncIOMotorDatabase):
        score = ScoringService.evaluate_ai_answer(data.question, data.answer)
        
        response_model = {"question": data.question, "answer": data.answer, "score": score}
        
        await db["interviews"].update_one(
            {"_id": ObjectId(data.interview_id)},
            {"$push": {"ai_interview.responses": response_model}}
        )
        
        return {"message": "Answer recorded", "score": score}
