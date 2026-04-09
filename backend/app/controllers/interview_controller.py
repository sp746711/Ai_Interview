from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.interview_schema import InterviewStart, InterviewSetup
from backend.app.models.interview_model import InterviewModel, ResumeData
from backend.app.services.resume_service import ResumeService
from backend.app.services.scoring_service import ScoringService
from bson import ObjectId

class InterviewController:
    @staticmethod
    async def start_interview(user_id: str, data: InterviewStart, db: AsyncIOMotorDatabase):
        new_interview = InterviewModel(user_id=user_id)
        result = await db["interviews"].insert_one(new_interview.model_dump())
        return {"interview_id": str(result.inserted_id), "message": "Interview started"}

    @staticmethod
    async def process_round1(interview_id: str, interview_type: str, file: UploadFile, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        # In round 1, we might not have a specific role yet.
        # Fallback to "General Candidate" or use interview_type if role isn't populated
        resume_result = await ResumeService.process_resume(file, interview_type)
        resume_data = {"score": resume_result["score"], "skills": resume_result["skills"]}
        
        await db["interviews"].update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {
                "interview_type": interview_type,
                "resume_data": resume_data
            }}
        )
        return {"message": "Round 1 complete", "resume_score": resume_data.score}

    @staticmethod
    async def setup_round3(data: InterviewSetup, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(data.interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        await db["interviews"].update_one(
            {"_id": ObjectId(data.interview_id)},
            {"$set": {
                "role": data.role,
                "difficulty": data.difficulty,
                "duration": data.duration
            }}
        )
        return {"message": "AI Interview setup complete"}

    @staticmethod
    async def get_result(interview_id: str, db: AsyncIOMotorDatabase):
        interview = await db["interviews"].find_one({"_id": ObjectId(interview_id)})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        
        resume_s = interview.get("resume_data", {}).get("score", 0)
        test_s = interview.get("test_score", 0)
        ai_responses = interview.get("responses", [])
        
        ai_s = sum([r.get("score", 0) for r in ai_responses]) / len(ai_responses) if ai_responses else 0
        
        final_score = ScoringService.calculate_final_score(resume_s, test_s, int(ai_s))
        
        await db["interviews"].update_one(
            {"_id": ObjectId(interview_id)},
            {"$set": {"final_score": final_score}}
        )
        
        interview["final_score"] = final_score
        interview["id"] = str(interview["_id"])
        return interview

