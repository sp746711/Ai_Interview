from typing import Optional

from pydantic import BaseModel, Field


class InterviewStart(BaseModel):
    interview_type: str = Field(default="technical")


class InterviewRound1(BaseModel):
    interview_id: str
    interview_type: str = Field(default="technical")


class InterviewSetup(BaseModel):
    interview_id: str
    role: str
    difficulty: str
    duration: int


class InterviewStartResponse(BaseModel):
    interview_id: str
    message: str


class InterviewResult(BaseModel):
    id: str
    user_id: str
    interview_type: str
    role: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[int] = None
    resume_score: int = 0
    test_score: int = 0
    interview_score: int = 0
    final_score: int = 0

