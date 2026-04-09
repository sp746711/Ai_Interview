"""
Authentication controller
"""
from fastapi import HTTPException
from app.schemas.user_schema import UserRegister, UserLogin, TokenResponse
from app.services import auth_service

async def register_user(user_data: UserRegister) -> TokenResponse:
    """Register a new user"""
    return await auth_service.register_user(user_data)

async def login_user(user_data: UserLogin) -> TokenResponse:
    """Login user"""
    return await auth_service.login_user(user_data)

async def refresh_token(token: str):
    """Refresh access token"""
    return await auth_service.refresh_token(token)
