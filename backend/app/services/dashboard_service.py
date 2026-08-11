from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional


class DashboardService:
    """
    Dashboard-only data service.

    IMPORTANT:
    - Reads existing interview records.
    - Does NOT modify Round 1, Round 2, or Round 3.
    - Does NOT change interview workflow.
    - Does NOT change interview scoring.
    """

    COMPLETED_STAGE = "feedback"

    @staticmethod
    def _to_number(value: Any) -> Optional[float]:
        """
        Safely convert a value to a number.

        Returns None when the value is missing/invalid.
        """
        if value is None:
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _format_score(value: Optional[float]) -> Optional[float]:
        """
        Keep integer-looking scores clean while preserving decimals.
        """
        if value is None:
            return None

        if float(value).is_integer():
            return int(value)

        return round(float(value), 1)

    @staticmethod
    def _is_completed(interview: Dict[str, Any]) -> bool:
        """
        An interview is completed only when the existing interview
        stage is 'feedback'.

        This deliberately uses the existing Round 1/2/3 stage field.
        """
        return (
            str(
                interview.get(
                    "stage",
                    "round1",
                )
            ).strip().lower()
            == DashboardService.COMPLETED_STAGE
        )

    @staticmethod
    def _get_interview_type(
        interview: Dict[str, Any],
    ) -> str:
        """
        Normalize the existing interview_type field.
        """
        value = str(
            interview.get(
                "interview_type",
                "technical",
            )
            or "technical"
        ).strip().lower()

        if value in {
            "nontechnical",
            "non_technical",
            "non technical",
            "non-tech",
            "nontech",
        }:
            return "non-technical"

        return "technical"

    @staticmethod
    def _get_role(
        interview: Dict[str, Any],
    ) -> str:
        """
        Get the role already stored by the interview flow.

        We do not invent roles.
        """
        role = interview.get("role")

        if role is not None:
            role = str(role).strip()

        if role:
            return role

        # For incomplete interviews where role has not yet been
        # selected, show a meaningful dashboard label.
        return "Role Not Selected"

    @staticmethod
    def _get_created_at(
        interview: Dict[str, Any],
    ) -> Optional[datetime]:
        value = interview.get("created_at")

        if isinstance(value, datetime):
            return value

        return None

    @staticmethod
    def _get_final_score(
        interview: Dict[str, Any],
    ) -> Optional[float]:
        """
        Return a final score only for completed interviews.

        IMPORTANT:
        An incomplete interview never becomes score 0 here.
        """
        if not DashboardService._is_completed(interview):
            return None

        score = DashboardService._to_number(
            interview.get("final_score")
        )

        if score is None:
            return None

        return score

    @staticmethod
    def _get_status(
        interview: Dict[str, Any],
    ) -> Dict[str, str]:
        """
        Convert the existing interview stage into dashboard-friendly
        status information.

        This is read-only interpretation.
        It does not modify the interview.
        """
        stage = str(
            interview.get(
                "stage",
                "round1",
            )
            or "round1"
        ).strip().lower()

        if stage == "feedback":
            return {
                "status": "completed",
                "status_label": "Completed",
                "progress_label": "3 / 3 Rounds",
            }

        if stage == "ai":
            return {
                "status": "incomplete",
                "status_label": "Round 3 Incomplete",
                "progress_label": "Round 3 / 3",
            }

        if stage == "setup":
            return {
                "status": "incomplete",
                "status_label": "Round 3 Not Started",
                "progress_label": "2 / 3 Rounds",
            }

        if stage == "test":
            return {
                "status": "incomplete",
                "status_label": "Round 2 Incomplete",
                "progress_label": "Round 2 / 3",
            }

        return {
            "status": "incomplete",
            "status_label": "Round 1 Incomplete",
            "progress_label": "Round 1 / 3",
        }

    @staticmethod
    def _serialize_recent_interview(
        interview: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Convert a MongoDB interview document into the dashboard
        Recent Interviews format.
        """
        created_at = DashboardService._get_created_at(
            interview
        )

        status = DashboardService._get_status(
            interview
        )

        score = DashboardService._get_final_score(
            interview
        )

        return {
            "id": str(interview.get("_id")),
            "date": (
                created_at.isoformat()
                if created_at
                else None
            ),
            "role": DashboardService._get_role(
                interview
            ),
            "interview_type":
                DashboardService._get_interview_type(
                    interview
                ),
            "score":
                DashboardService._format_score(score),
            "status": status["status"],
            "status_label": status["status_label"],
            "progress_label":
                status["progress_label"],
            "stage": interview.get(
                "stage",
                "round1",
            ),
        }

    @staticmethod
    def _serialize_history_item(
        interview: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Full dashboard history item.

        Includes incomplete attempts and never assigns them a fake
        final score.
        """
        created_at = DashboardService._get_created_at(
            interview
        )

        status = DashboardService._get_status(
            interview
        )

        score = DashboardService._get_final_score(
            interview
        )

        return {
            "id": str(interview.get("_id")),
            "date": (
                created_at.isoformat()
                if created_at
                else None
            ),
            "role": DashboardService._get_role(
                interview
            ),
            "interview_type":
                DashboardService._get_interview_type(
                    interview
                ),
            "difficulty": interview.get(
                "difficulty"
            ),
            "stage": interview.get(
                "stage",
                "round1",
            ),
            "status": status["status"],
            "status_label": status["status_label"],
            "progress_label":
                status["progress_label"],
            "final_score":
                DashboardService._format_score(score),
        }

    @staticmethod
    def calculate_global_stats(
        interviews: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Calculate the four global dashboard statistics.

        These include Technical + Non-Technical interviews.
        """
        total_interviews = len(interviews)

        completed_scores = []

        for interview in interviews:
            score = DashboardService._get_final_score(
                interview
            )

            if score is not None:
                completed_scores.append(score)

        completed_interviews = sum(
            1
            for interview in interviews
            if DashboardService._is_completed(
                interview
            )
        )

        average_score = (
            sum(completed_scores)
            / len(completed_scores)
            if completed_scores
            else None
        )

        best_score = (
            max(completed_scores)
            if completed_scores
            else None
        )

        return {
            "total_interviews":
                total_interviews,

            "average_score":
                DashboardService._format_score(
                    average_score
                ),

            "completed_interviews":
                completed_interviews,

            "best_score":
                DashboardService._format_score(
                    best_score
                ),
        }

    @staticmethod
    def calculate_score_overview(
        interviews: List[Dict[str, Any]],
        interview_type: str,
    ) -> Dict[str, Any]:
        """
        Build Score Overview for the selected analytics domain.

        Only completed interviews of the selected type are used.
        """
        normalized_type = str(
            interview_type or "technical"
        ).strip().lower()

        filtered = [
            interview
            for interview in interviews
            if DashboardService._get_interview_type(
                interview
            )
            == normalized_type
            and DashboardService._is_completed(
                interview
            )
        ]

        # Oldest -> newest for chart/overview order.
        filtered.sort(
            key=lambda item:
                DashboardService._get_created_at(
                    item
                )
                or datetime.min
        )

        labels = []
        scores = []

        for index, interview in enumerate(
            filtered,
            start=1,
        ):
            score = DashboardService._get_final_score(
                interview
            )

            if score is None:
                continue

            labels.append(
                f"Interview {index}"
            )

            scores.append(
                DashboardService._format_score(
                    score
                )
            )

        return {
            "interview_type":
                normalized_type,

            "labels": labels,

            "scores": scores,

            "count": len(scores),
        }

    @staticmethod
    def calculate_interviews_by_role(
        interviews: List[Dict[str, Any]],
        interview_type: str,
    ) -> Dict[str, Any]:
        """
        Calculate role distribution for the selected analytics type.

        The roles are read from actual interview history.
        No roles are hardcoded.
        """
        normalized_type = str(
            interview_type or "technical"
        ).strip().lower()

        filtered = [
            interview
            for interview in interviews
            if DashboardService._get_interview_type(
                interview
            )
            == normalized_type
        ]

        role_counter = Counter(
            DashboardService._get_role(
                interview
            )
            for interview in filtered
        )

        total = sum(
            role_counter.values()
        )

        roles = []

        for role, count in role_counter.most_common():
            percentage = (
                (count / total) * 100
                if total
                else 0
            )

            roles.append(
                {
                    "role": role,
                    "count": count,
                    "percentage": round(
                        percentage,
                        1,
                    ),
                }
            )

        return {
            "interview_type":
                normalized_type,

            "total_interviews":
                total,

            "roles": roles,
        }

    @staticmethod
    def calculate_performance(
        interviews: List[Dict[str, Any]],
        interview_type: str,
    ) -> Dict[str, Any]:
        """
        Calculate performance for the selected analytics type.
        """
        normalized_type = str(
            interview_type or "technical"
        ).strip().lower()

        filtered = [
            interview
            for interview in interviews
            if DashboardService._get_interview_type(
                interview
            )
            == normalized_type
        ]

        completed_scores = []

        for interview in filtered:
            score = DashboardService._get_final_score(
                interview
            )

            if score is not None:
                completed_scores.append(score)

        completed_count = len(
            completed_scores
        )

        total_count = len(
            filtered
        )

        average_score = (
            sum(completed_scores)
            / completed_count
            if completed_count
            else None
        )

        best_score = (
            max(completed_scores)
            if completed_scores
            else None
        )

        completion_rate = (
            (completed_count / total_count)
            * 100
            if total_count
            else 0
        )

        return {
            "interview_type":
                normalized_type,

            "total_interviews":
                total_count,

            "completed_interviews":
                completed_count,

            "average_score":
                DashboardService._format_score(
                    average_score
                ),

            "best_score":
                DashboardService._format_score(
                    best_score
                ),

            "completion_rate":
                round(
                    completion_rate,
                    1,
                ),
        }

    @staticmethod
    def build_overview(
        interviews: List[Dict[str, Any]],
        recent_limit: int = 10,
    ) -> Dict[str, Any]:
        """
        Build the complete dashboard overview.

        Global statistics are mixed Technical + Non-Technical.
        Recent Interviews are also mixed.
        """
        sorted_interviews = sorted(
            interviews,
            key=lambda item:
                DashboardService._get_created_at(
                    item
                )
                or datetime.min,
            reverse=True,
        )

        recent = [
            DashboardService._serialize_recent_interview(
                interview
            )
            for interview in sorted_interviews[
                :recent_limit
            ]
        ]

        return {
            "stats":
                DashboardService.calculate_global_stats(
                    interviews
                ),

            "recent_interviews":
                recent,
        }

    @staticmethod
    def build_analytics(
        interviews: List[Dict[str, Any]],
        interview_type: str,
    ) -> Dict[str, Any]:
        """
        Build the three analytics cards controlled by the
        Dashboard Analytics Domain selector.
        """
        normalized_type = str(
            interview_type or "technical"
        ).strip().lower()

        if normalized_type not in {
            "technical",
            "non-technical",
        }:
            normalized_type = "technical"

        return {
            "interview_type":
                normalized_type,

            "score_overview":
                DashboardService.calculate_score_overview(
                    interviews,
                    normalized_type,
                ),

            "interviews_by_role":
                DashboardService.calculate_interviews_by_role(
                    interviews,
                    normalized_type,
                ),

            "performance":
                DashboardService.calculate_performance(
                    interviews,
                    normalized_type,
                ),
        }

    @staticmethod
    def build_history(
        interviews: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Return all user interview attempts.

        Technical + Non-Technical
        Completed + Incomplete
        """
        sorted_interviews = sorted(
            interviews,
            key=lambda item:
                DashboardService._get_created_at(
                    item
                )
                or datetime.min,
            reverse=True,
        )

        return [
            DashboardService._serialize_history_item(
                interview
            )
            for interview in sorted_interviews
        ]