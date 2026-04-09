"""
Test/Assessment routes
"""
from fastapi import APIRouter
from typing import List
from app.schemas.test_schema import TestCreate, TestSubmit, TestResponse
from app.controllers import test_controller

router = APIRouter()

@router.post("/", response_model=TestResponse)
async def create_test(test_data: TestCreate):
    """Create a new test"""
    return await test_controller.create_test(test_data)

@router.get("/{test_id}", response_model=TestResponse)
async def get_test(test_id: str):
    """Get test details"""
    return await test_controller.get_test(test_id)

@router.get("/", response_model=List[TestResponse])
async def list_tests():
    """List all tests"""
    return await test_controller.list_tests()

@router.post("/{test_id}/submit")
async def submit_test(test_id: str, submission: TestSubmit):
    """Submit test answers"""
    return await test_controller.submit_test(test_id, submission)
