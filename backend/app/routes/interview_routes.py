from fastapi import APIRouter, Depends, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.interview_schema import InterviewStart
from backend.app.controllers.interview_controller import InterviewController
from backend.app.dependencies.database import get_database
from backend.app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.post("/start")
async def start_interview(
    data: InterviewStart, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.start_interview(user["id"], data, db)

@router.post("/round1")
async def process_round1(
    interview_id: str, 
    file: UploadFile = File(...), 
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.process_round1(interview_id, file, db)

@router.get("/result")
async def get_result(
    interview_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.get_result(interview_id, db)

