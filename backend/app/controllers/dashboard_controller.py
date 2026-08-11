from typing import Any, Dict, List

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from backend.app.services.dashboard_service import DashboardService


class DashboardController:
    """
    Controller for Dashboard-only APIs.

    IMPORTANT:
    This controller only READS existing interview data.

    It does NOT modify:
    - Round 1
    - Round 2
    - Round 3
    - Final Interview
    - Feedback generation
    - Question generation
    """

    COLLECTION_NAME = "interviews"

    # =========================================================
    # GET USER INTERVIEWS
    # =========================================================

    @staticmethod
    async def _get_user_interviews(
        user_id: str,
        db: AsyncIOMotorDatabase,
    ) -> List[Dict[str, Any]]:
        """
        Read the current user's interview records.

        Dashboard only reads existing records.
        """

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="User authentication required",
            )

        cursor = (
            db[DashboardController.COLLECTION_NAME]
            .find(
                {
                    "user_id": user_id,
                }
            )
            .sort(
                "created_at",
                -1,
            )
        )

        return await cursor.to_list(
            length=500
        )

    # =========================================================
    # DASHBOARD OVERVIEW
    # =========================================================

    @staticmethod
    async def get_overview(
        user_id: str,
        db: AsyncIOMotorDatabase,
    ) -> Dict[str, Any]:
        """
        Return global dashboard information.

        Includes:
        - Total Interviews
        - Average Score
        - Completed Interviews
        - Best Score
        - Recent Interviews

        Technical and Non-Technical are combined here.
        """

        interviews = await (
            DashboardController._get_user_interviews(
                user_id,
                db,
            )
        )

        return DashboardService.build_overview(
            interviews
        )

    # =========================================================
    # DASHBOARD ANALYTICS
    # =========================================================

    @staticmethod
    async def get_analytics(
        user_id: str,
        interview_type: str,
        db: AsyncIOMotorDatabase,
    ) -> Dict[str, Any]:
        """
        Return analytics for the selected domain.

        interview_type:
            technical
            non-technical

        This controls ONLY:
        - Score Overview
        - Interviews By Role
        - Your Performance
        """

        normalized_type = str(
            interview_type or "technical"
        ).strip().lower()

        if normalized_type in {
            "nontechnical",
            "non_technical",
            "non technical",
            "non-tech",
            "nontech",
        }:
            normalized_type = "non-technical"

        elif normalized_type != "technical":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid analytics type. "
                    "Use 'technical' or "
                    "'non-technical'."
                ),
            )

        interviews = await (
            DashboardController._get_user_interviews(
                user_id,
                db,
            )
        )

        return DashboardService.build_analytics(
            interviews,
            normalized_type,
        )

    # =========================================================
    # DASHBOARD HISTORY
    # =========================================================

    @staticmethod
    async def get_history(
        user_id: str,
        db: AsyncIOMotorDatabase,
    ) -> Dict[str, Any]:
        """
        Return ALL dashboard history.

        Includes:
        - Technical
        - Non-Technical
        - Completed
        - Incomplete
        """

        interviews = await (
            DashboardController._get_user_interviews(
                user_id,
                db,
            )
        )

        history = DashboardService.build_history(
            interviews
        )

        return {
            "total": len(history),
            "history": history,
        }