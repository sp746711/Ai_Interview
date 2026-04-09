from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserModel(BaseModel):
    name: str
    email: EmailStr
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserInDB(UserModel):
    id: str = Field(alias="_id")
