from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ResumeData(BaseModel):
    score: int = 0
    skills: List[str] = Field(default_factory=list)


class TestData(BaseModel):
    score: int = 0
    answers: Dict[str, str] = Field(default_factory=dict)


class AIInterviewData(BaseModel):
    score: int = 0
    responses: List[Dict[str, str]] = Field(default_factory=list)


class InterviewModel(BaseModel):
    user_id: str
    stage: str = "round1"
    interview_type: str = "technical"
    resume_data: Dict[str, Any] = Field(default_factory=dict)
    role: Optional[str] = None
    difficulty: Optional[str] = None
    duration: Optional[int] = None
    test_score: float = 0
    interview_score: float = 0
    responses: List[Dict[str, Any]] = Field(default_factory=list)
    final_score: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InterviewInDB(InterviewModel):
    id: str = Field(alias="_id")
