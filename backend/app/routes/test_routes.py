from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.app.schemas.test_schema import TestSubmit
from backend.app.controllers.test_controller import TestController
from backend.app.dependencies.database import get_database
from backend.app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/test", tags=["Test"])

@router.get("/questions")
async def get_questions(
    role: str,
    difficulty: str,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await TestController.get_questions(role, difficulty, db)

@router.post("/submit")
async def submit_test(
    data: TestSubmit,
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user)
):
    return await TestController.submit_test(data, db)

