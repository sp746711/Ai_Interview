from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.user_schema import UserCreate, UserLogin, Token
from app.controllers.auth_controller import AuthController
from app.dependencies.database import get_database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
async def register(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    return await AuthController.register(user, db)

@router.post("/login", response_model=Token)
async def login(user: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    return await AuthController.login(user, db)
