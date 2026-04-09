"""
Test/Assessment database model
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TestQuestion(BaseModel):
    """Test question structure"""
    question_id: str
    question_text: str
    options: List[str] = []
    correct_answer: str
    explanation: Optional[str] = None

class TestModel(BaseModel):
    """Test document model"""
    _id: Optional[str] = None
    title: str
    topic: str
    user_id: Optional[str] = None
    questions: List[TestQuestion] = []
    duration: int = 0  # seconds
    passing_score: float = 70.0
    score: Optional[float] = None
    answers: Optional[List[str]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Python Basics",
                "topic": "Python",
                "duration": 1800,
                "passing_score": 70.0
            }
        }
