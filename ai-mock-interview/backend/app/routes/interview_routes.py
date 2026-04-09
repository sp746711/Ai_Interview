"""
Interview routes
"""
from fastapi import APIRouter, Depends
from typing import List
from app.schemas.interview_schema import (
    InterviewCreate, InterviewUpdate, InterviewResponse
)
from app.controllers import interview_controller

router = APIRouter()

@router.post("/", response_model=InterviewResponse)
async def create_interview(interview_data: InterviewCreate):
    """Create a new interview"""
    return await interview_controller.create_interview(interview_data)

@router.get("/{interview_id}", response_model=InterviewResponse)
async def get_interview(interview_id: str):
    """Get interview details"""
    return await interview_controller.get_interview(interview_id)

@router.get("/", response_model=List[InterviewResponse])
async def list_interviews():
    """List all interviews for user"""
    return await interview_controller.list_interviews()

@router.put("/{interview_id}", response_model=InterviewResponse)
async def update_interview(interview_id: str, interview_data: InterviewUpdate):
    """Update interview"""
    return await interview_controller.update_interview(interview_id, interview_data)

@router.delete("/{interview_id}")
async def delete_interview(interview_id: str):
    """Delete interview"""
    return await interview_controller.delete_interview(interview_id)
