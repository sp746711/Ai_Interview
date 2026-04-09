"""
User database model
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    """User roles"""
    CANDIDATE = "candidate"
    ADMIN = "admin"

class UserModel(BaseModel):
    """User document model"""
    _id: Optional[str] = None
    email: str = Field(..., unique=True)
    username: str
    password_hash: str
    role: UserRole = UserRole.CANDIDATE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "john_doe",
                "password_hash": "hashed_password",
                "role": "candidate"
            }
        }
