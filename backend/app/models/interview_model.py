from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class ResumeData(BaseModel):
    score: int = 0
    skills: List[str] = []

class TestData(BaseModel):
    score: int = 0
    answers: Dict[str, str] = {} # question string or id -> answer string

class AIInterviewData(BaseModel):
    score: int = 0
    responses: List[Dict[str, str]] = [] # list of {question: str, answer: str, score: int}

class InterviewModel(BaseModel):
    user_id: str
    interview_type: str = ""
    role: str = ""
    difficulty: str = ""
    duration: int = 15
    resume: ResumeData = Field(default_factory=ResumeData)
    test: TestData = Field(default_factory=TestData)
    ai_interview: AIInterviewData = Field(default_factory=AIInterviewData)
    final_score: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InterviewInDB(InterviewModel):
    id: str = Field(alias="_id")
