from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.interview_schema import InterviewStart
from app.models.interview_model import InterviewModel, ResumeData
from app.services.resume_service import ResumeService
from app.services.scoring_service import ScoringService
from bson import ObjectId

class InterviewController:
    @staticmethod
    async def start_interview(user_id: str, data: InterviewStart, db: AsyncIOMotorDatabase):
        new_interview = InterviewModel(user_id=user_id, role=data.role, difficulty=data.difficulty)
        result = await db["interviews"].insert_one(new_interview.model_dump())
        return {"interview_id": str(result.inserted_id), "message": "Interview started"}

    @staticmethod
    async def process_round1(interview_id: str, file: UploadFile, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        resume_result = await ResumeService.process_resume(file, interview["role"])
        resume_data = ResumeData(score=resume_result["score"], skills=resume_result["skills"])
        
        await db["interviews"].update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {"resume": resume_data.model_dump()}}
        )
        return {"message": "Round 1 complete", "resume_score": resume_data.score}

    @staticmethod
    async def get_result(interview_id: str, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        resume_s = interview.get("resume", {}).get("score", 0)
        test_s = interview.get("test", {}).get("score", 0)
        ai_responses = interview.get("ai_interview", {}).get("responses", [])
        
        ai_s = sum([r.get("score", 0) for r in ai_responses]) / len(ai_responses) if ai_responses else 0
        
        final_score = ScoringService.calculate_final_score(resume_s, test_s, int(ai_s))
        
        await db["interviews"].update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {"final_score": final_score}}
        )
        
        interview["final_score"] = final_score
        interview["id"] = str(interview["_id"])
        return interview
