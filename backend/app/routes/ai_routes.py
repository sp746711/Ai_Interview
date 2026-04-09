from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.controllers.ai_controller import AIController, AIAnswerSubmit
from app.dependencies.database import get_database
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/interview", tags=["AI Interview"])

@router.post("/question")
async def get_question(
    interview_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await AIController.get_question(interview_id, db)

@router.post("/answer")
async def submit_answer(
    data: AIAnswerSubmit,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await AIController.submit_answer(data, db)
