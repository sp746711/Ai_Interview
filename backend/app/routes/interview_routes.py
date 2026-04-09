from fastapi import APIRouter, Depends, File, Form, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.controllers.interview_controller import InterviewController
from backend.app.dependencies.auth import get_current_user
from backend.app.dependencies.database import get_database
from backend.app.schemas.interview_schema import InterviewSetup, InterviewStart

router = APIRouter(prefix="/api/interview", tags=["Interview"])

@router.post("/start")
async def start_interview(
    data: InterviewStart, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.start_interview(user["id"], data, db)

@router.post("/round1")
async def round1(
    interview_id: str = Form(...),
    interview_type: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.round1(interview_id, interview_type, file, db)

@router.post("/setup")
async def setup(
    data: InterviewSetup,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.setup(data, db)

@router.get("/result")
async def get_result(
    interview_id: str, 
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.get_result(interview_id, db)

@router.get("/stage")
async def get_stage(
    interview_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.get_stage(interview_id, user["id"], db)

@router.get("/history")
async def get_history(
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await InterviewController.get_history(user["id"], db)

