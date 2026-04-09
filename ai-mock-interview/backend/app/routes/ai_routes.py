"""
AI routes
"""
from fastapi import APIRouter, UploadFile, File
from app.controllers import ai_controller

router = APIRouter()

@router.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Parse resume PDF"""
    return await ai_controller.parse_resume(file)

@router.post("/generate-questions")
async def generate_questions(job_title: str, difficulty: str):
    """Generate interview questions based on job title"""
    return await ai_controller.generate_questions(job_title, difficulty)

@router.post("/evaluate-answer")
async def evaluate_answer(question: str, answer: str):
    """Evaluate interview answer"""
    return await ai_controller.evaluate_answer(question, answer)

@router.post("/generate-feedback")
async def generate_feedback(interview_id: str):
    """Generate interview feedback"""
    return await ai_controller.generate_feedback(interview_id)
