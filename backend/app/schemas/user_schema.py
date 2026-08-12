from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str
    name: str
    email: EmailStr


class ProfileUpdate(BaseModel):
    name: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str