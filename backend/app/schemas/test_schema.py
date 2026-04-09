from pydantic import BaseModel
from typing import Dict

class TestSubmit(BaseModel):
    interview_id: str
    answers: Dict[str, str] # question -> selected_option

class TestResult(BaseModel):
    score: int
    total: int
