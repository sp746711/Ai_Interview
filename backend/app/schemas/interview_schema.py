from pydantic import BaseModel
from typing import Optional, List, Dict
from backend.app.models.interview_model import ResumeData, TestData, AIInterviewData

class InterviewStart(BaseModel):
    # No params needed to just start a blank interview flow
    pass

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
    role: str
    difficulty: str
    final_score: int
    resume: ResumeData
    test: TestData
    ai_interview: AIInterviewData

