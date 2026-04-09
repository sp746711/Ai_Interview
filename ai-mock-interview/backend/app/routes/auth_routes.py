"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user_schema import (
    UserRegister, UserLogin, TokenResponse
)
from app.controllers import auth_controller

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    """Register a new user"""
    return await auth_controller.register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login user"""
    return await auth_controller.login_user(user_data)

@router.post("/refresh")
async def refresh_token(token: str):
    """Refresh access token"""
    return await auth_controller.refresh_token(token)
