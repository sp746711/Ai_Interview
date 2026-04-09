"""
User role constants
"""

CANDIDATE = "candidate"
ADMIN = "admin"
INTERVIEWER = "interviewer"

ROLES = [CANDIDATE, ADMIN, INTERVIEWER]

PERMISSIONS = {
    CANDIDATE: ["take_interview", "take_test", "view_feedback"],
    ADMIN: ["create_test", "manage_users", "view_analytics"],
    INTERVIEWER: ["conduct_interview", "evaluate_answers"]
}
