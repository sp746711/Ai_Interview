"""
Test/Assessment request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TestQuestionSchema(BaseModel):
    """Test question schema"""
    question_id: str
    question_text: str
    options: List[str]
    correct_answer: str
    explanation: Optional[str] = None

class TestCreate(BaseModel):
    """Create test request"""
    title: str
    topic: str
    questions: List[TestQuestionSchema]
    duration: int = 1800
    passing_score: float = 70.0

class TestSubmit(BaseModel):
    """Submit test answers"""
    test_id: str
    answers: List[str]

class TestResponse(BaseModel):
    """Test response"""
    _id: str
    title: str
    topic: str
    questions: List[TestQuestionSchema]
    duration: int
    passing_score: float
    score: Optional[float] = None
    created_at: datetime
