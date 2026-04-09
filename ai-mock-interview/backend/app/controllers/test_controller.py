"""
Test controller
"""
from app.schemas.test_schema import TestCreate, TestSubmit, TestResponse
from typing import List

async def create_test(test_data: TestCreate) -> TestResponse:
    """Create a new test"""
    pass

async def get_test(test_id: str) -> TestResponse:
    """Get test details"""
    pass

async def list_tests() -> List[TestResponse]:
    """List all tests"""
    pass

async def submit_test(test_id: str, submission: TestSubmit):
    """Submit test answers"""
    pass
