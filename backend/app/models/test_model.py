from pydantic import BaseModel, Field
from typing import List

class TestQuestionModel(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    difficulty: str
    role: str

class TestQuestionInDB(TestQuestionModel):
    id: str = Field(alias="_id")
