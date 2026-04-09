from pydantic import BaseModel
from typing import Optional, List, Dict
from app.models.interview_model import ResumeData, TestData, AIInterviewData

class InterviewStart(BaseModel):
    role: str
    difficulty: str

class InterviewStartResponse(BaseModel):
    interview_id: str
    message: str

class InterviewResult(BaseModel):
    id: str
    user_id: str
    role: str
    difficulty: str
    final_score: int
    resume: ResumeData
    test: TestData
    ai_interview: AIInterviewData
