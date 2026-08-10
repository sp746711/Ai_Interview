from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.controllers.ai_controller import (
    AIController,
    AIAnswerSubmit,
    AIReadinessSubmit,
    AISkipSubmit,
)

from backend.app.dependencies.database import get_database
from backend.app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/api/interview",
    tags=["AI Interview"]
)


# =========================================================
# FINAL ROUND — READINESS
# =========================================================

@router.post("/readiness")
async def check_readiness(
    data: AIReadinessSubmit,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    return await AIController.check_readiness(
        data,
        db
    )


# =========================================================
# FINAL ROUND — GET QUESTION
# =========================================================

@router.post("/question")
async def get_question(
    interview_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    return await AIController.get_question(
        interview_id,
        db
    )


# =========================================================
# FINAL ROUND — SUBMIT VOICE ANSWER
# =========================================================

@router.post("/answer")
async def submit_answer(
    data: AIAnswerSubmit,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    return await AIController.submit_answer(
        data,
        db
    )


# =========================================================
# FINAL ROUND — SKIP QUESTION
# =========================================================

@router.post("/skip")
async def skip_question(
    data: AISkipSubmit,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    return await AIController.skip_question(
        data,
        db
    )