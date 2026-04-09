"""
Interview controller
"""
from app.schemas.interview_schema import (
    InterviewCreate, InterviewUpdate, InterviewResponse
)
from typing import List

async def create_interview(interview_data: InterviewCreate) -> InterviewResponse:
    """Create a new interview"""
    pass

async def get_interview(interview_id: str) -> InterviewResponse:
    """Get interview details"""
    pass

async def list_interviews() -> List[InterviewResponse]:
    """List all interviews for user"""
    pass

async def update_interview(interview_id: str, interview_data: InterviewUpdate) -> InterviewResponse:
    """Update interview"""
    pass

async def delete_interview(interview_id: str):
    """Delete interview"""
    pass
