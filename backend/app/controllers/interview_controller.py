from bson import ObjectId
from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.models.interview_model import InterviewModel
from backend.app.schemas.interview_schema import InterviewSetup, InterviewStart
from backend.app.services.resume_service import ResumeService
from backend.app.services.scoring_service import ScoringService

class InterviewController:
    @staticmethod
    def _parse_object_id(value: str) -> ObjectId:
        try:
            return ObjectId(value)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid interview id")

    @staticmethod
    async def start_interview(user_id: str, data: InterviewStart, db: AsyncIOMotorDatabase):
        interview_type = str(data.interview_type or "technical").strip().lower()
        new_interview = InterviewModel(user_id=user_id, stage="round1", interview_type=interview_type)
        result = await db["interviews"].insert_one(new_interview.model_dump())
        return {"interview_id": str(result.inserted_id), "message": "Interview started successfully"}

    @staticmethod
    async def round1(interview_id: str, interview_type: str, file: UploadFile, db: AsyncIOMotorDatabase):
        oid = InterviewController._parse_object_id(interview_id)
        interview = await db["interviews"].find_one({"_id": oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.get("stage") != "round1":
            raise HTTPException(status_code=409, detail="Round 1 already completed or invalid stage")

        resume_result = await ResumeService.process_resume(file, interview_type)
        resume_data = {"score": resume_result["score"], "skills": resume_result["skills"]}

        await db["interviews"].update_one(
            {"_id": oid},
            {"$set": {
                "interview_type": str(interview_type or "technical").strip().lower(),
                "resume_data": resume_data,
                "stage": "test",
            }}
        )
        return {
            "message": "Round 1 complete",
            "resume_score": resume_data["score"],
            "skills_extracted": resume_data["skills"],
        }

    @staticmethod
    async def setup(data: InterviewSetup, db: AsyncIOMotorDatabase):
        oid = InterviewController._parse_object_id(data.interview_id)
        interview = await db["interviews"].find_one({"_id": oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        if interview.get("stage") != "setup":
            raise HTTPException(status_code=409, detail="Complete test before setup")

        await db["interviews"].update_one(
            {"_id": oid},
            {"$set": {
                "role": data.role,
                "difficulty": data.difficulty,
                "duration": data.duration,
                "stage": "ai",
            }}
        )
        return {"message": "AI Interview setup complete"}

    @staticmethod
    async def get_result(interview_id: str, db: AsyncIOMotorDatabase):
        oid = InterviewController._parse_object_id(interview_id)
        interview = await db["interviews"].find_one({"_id": oid})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        resume_s = interview.get("resume_data", {}).get("score", 0)
        test_s = interview.get("test_score", 0)
        ai_responses = interview.get("responses", [])

        ai_s = sum([r.get("score", 0) for r in ai_responses]) / len(ai_responses) if ai_responses else 0
        final_score = ScoringService.calculate_final_score(int(resume_s), int(test_s), int(ai_s))

        await db["interviews"].update_one(
            {"_id": oid},
            {"$set": {"interview_score": int(ai_s), "final_score": final_score, "stage": "feedback"}}
        )

        result = {
            "id": str(interview["_id"]),
            "user_id": interview["user_id"],
            "interview_type": interview.get("interview_type", "technical"),
            "role": interview.get("role"),
            "difficulty": interview.get("difficulty"),
            "duration": interview.get("duration"),
            "resume_score": int(resume_s),
            "test_score": int(test_s),
            "interview_score": int(ai_s),
            "final_score": int(final_score),
            "strengths": [
                "Strong core fundamentals" if test_s >= 60 else "Shows learning potential",
                "Good communication clarity" if ai_s >= 60 else "Can improve answer structure",
            ],
            "weaknesses": [
                "Resume alignment needs improvement" if resume_s < 60 else "Minor resume gaps",
                "Technical depth can be improved" if test_s < 60 else "Advanced topics can be strengthened",
            ],
            "suggestions": [
                "Practice role-specific MCQs daily",
                "Use STAR format for behavioral answers",
                "Tailor resume keywords to your target role",
            ],
        }
        return result

    @staticmethod
    async def get_stage(interview_id: str, user_id: str, db: AsyncIOMotorDatabase):
        oid = InterviewController._parse_object_id(interview_id)
        interview = await db["interviews"].find_one({"_id": oid, "user_id": user_id})
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")
        return {
            "interview_id": interview_id,
            "stage": interview.get("stage", "round1"),
            "interview_type": interview.get("interview_type", "technical"),
        }

    @staticmethod
    async def get_history(user_id: str, db: AsyncIOMotorDatabase):
        cursor = db["interviews"].find({"user_id": user_id}).sort("created_at", -1)
        docs = await cursor.to_list(length=200)

        history = []
        for item in docs:
            final_score = int(item.get("final_score", 0))
            history.append(
                {
                    "id": str(item["_id"]),
                    "date": item.get("created_at"),
                    "role": item.get("role") or item.get("interview_type", "technical"),
                    "difficulty": item.get("difficulty"),
                    "final_score": final_score,
                    "stage": item.get("stage", "round1"),
                }
            )

        scores = [h["final_score"] for h in history]
        total = len(history)
        avg_score = round(sum(scores) / total, 1) if total else 0
        best_score = max(scores) if scores else 0
        return {"total": total, "avg_score": avg_score, "best_score": best_score, "history": history}

