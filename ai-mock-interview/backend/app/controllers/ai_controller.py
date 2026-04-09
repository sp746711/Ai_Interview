"""
AI controller
"""
from fastapi import UploadFile

async def parse_resume(file: UploadFile):
    """Parse resume PDF"""
    pass

async def generate_questions(job_title: str, difficulty: str):
    """Generate interview questions"""
    pass

async def evaluate_answer(question: str, answer: str):
    """Evaluate interview answer"""
    pass

async def generate_feedback(interview_id: str):
    """Generate interview feedback"""
    pass
