"""
Interview request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class InterviewCreate(BaseModel):
    """Create interview request"""
    job_title: str
    difficulty: str = Field(..., regex="^(easy|medium|hard)$")

class QuestionResponseSchema(BaseModel):
    """Question response schema"""
    question_id: str
    user_answer: str
    duration: int

class InterviewUpdate(BaseModel):
    """Update interview request"""
    status: str = Field(..., regex="^(scheduled|in_progress|completed|cancelled)$")
    responses: Optional[List[QuestionResponseSchema]] = None
    feedback: Optional[str] = None
    score: Optional[float] = None

class InterviewResponse(BaseModel):
    """Interview response"""
    _id: str
    user_id: str
    job_title: str
    difficulty: str
    status: str
    questions: List[str] = []
    score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
