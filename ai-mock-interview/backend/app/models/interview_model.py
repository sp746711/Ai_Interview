"""
Interview database model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class InterviewDifficulty(str, Enum):
    """Interview difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class InterviewStatus(str, Enum):
    """Interview status"""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class QuestionResponse(BaseModel):
    """User response to a question"""
    question_id: str
    user_answer: str
    duration: int  # seconds
    score: Optional[float] = None

class InterviewModel(BaseModel):
    """Interview document model"""
    _id: Optional[str] = None
    user_id: str
    job_title: str
    difficulty: InterviewDifficulty
    status: InterviewStatus = InterviewStatus.SCHEDULED
    questions: List[str] = []
    responses: List[QuestionResponse] = []
    feedback: Optional[str] = None
    score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user123",
                "job_title": "Software Engineer",
                "difficulty": "medium",
                "status": "in_progress"
            }
        }
