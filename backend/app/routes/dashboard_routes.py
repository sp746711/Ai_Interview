from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.controllers.dashboard_controller import (
    DashboardController,
)
from backend.app.dependencies.database import get_database
from backend.app.dependencies.auth import get_current_user


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


# =========================================================
# DASHBOARD OVERVIEW
# =========================================================

@router.get("/overview")
async def get_dashboard_overview(
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    """
    Global dashboard data.

    Includes:
    - Total Interviews
    - Average Score
    - Completed Interviews
    - Best Score
    - Recent Interviews

    Technical + Non-Technical are combined.
    """

    user_id = str(
        user.get("id")
        or user.get("_id")
        or user.get("user_id")
        or ""
    )

    return await DashboardController.get_overview(
        user_id=user_id,
        db=db,
    )


# =========================================================
# DASHBOARD ANALYTICS
# =========================================================

@router.get("/analytics")
async def get_dashboard_analytics(
    type: str = Query(
        default="technical",
        description=(
            "Analytics domain: "
            "technical or non-technical"
        ),
    ),
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    """
    Analytics controlled by the SECOND
    Technical / Non-Technical selector.

    Changes only:
    - Score Overview
    - Interviews By Role
    - Your Performance
    """

    user_id = str(
        user.get("id")
        or user.get("_id")
        or user.get("user_id")
        or ""
    )

    return await DashboardController.get_analytics(
        user_id=user_id,
        interview_type=type,
        db=db,
    )


# =========================================================
# DASHBOARD HISTORY
# =========================================================

@router.get("/history")
async def get_dashboard_history(
    db: AsyncIOMotorDatabase = Depends(get_database),
    user: dict = Depends(get_current_user),
):
    """
    Complete Dashboard history.

    Includes:
    - Technical
    - Non-Technical
    - Completed
    - Incomplete
    """

    user_id = str(
        user.get("id")
        or user.get("_id")
        or user.get("user_id")
        or ""
    )

    return await DashboardController.get_history(
        user_id=user_id,
        db=db,
    )