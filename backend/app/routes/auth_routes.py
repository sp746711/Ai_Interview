from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.schemas.user_schema import (
    UserCreate,
    UserLogin,
    Token,
    ProfileUpdate,
    ChangePassword,
)

from backend.app.controllers.auth_controller import AuthController
from backend.app.dependencies.database import get_database
from backend.app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# ======================================================
# REGISTER
# ======================================================

@router.post("/register")
async def register(
    user: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    return await AuthController.register(
        user,
        db
    )


# ======================================================
# LOGIN
# ======================================================

@router.post("/login", response_model=Token)
async def login(
    user: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    return await AuthController.login(
        user,
        db
    )


# ======================================================
# UPDATE PROFILE
# ======================================================

@router.put("/profile")
async def update_profile(
    profile: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    return await AuthController.update_profile(
        profile,
        current_user,
        db
    )


# ======================================================
# CHANGE PASSWORD
# ======================================================

@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    return await AuthController.change_password(
        password_data,
        current_user,
        db
    )