import random

QUESTIONS = {
    "python_developer": {
        "easy": ["What are decorators in Python?", "Explain lists vs tuples.", "What is PEP 8?"],
        "medium": ["How does memory management work in Python?", "What is the difference between shallow and deep copy?", "Explain GIL."],
        "hard": ["How would you optimize a Python application?", "Explain asyncio and its event loop.", "What are metaclasses?"]
    },
    "frontend_developer": {
         "easy": ["What is the DOM?", "Explain CSS flexbox.", "What are closures in JS?"],
         "medium": ["Explain React hooks.", "What is the event loop in JS?", "How do you manage state?"],
         "hard": ["How do you optimize React performance?", "Explain SSR vs CSR.", "What is web assembly?"]
    }
}

class AIService:
    @staticmethod
    def generate_question(role: str, difficulty: str) -> str:
        role_questions = QUESTIONS.get(role, QUESTIONS.get("python_developer"))
        diff_questions = role_questions.get(difficulty, role_questions.get("easy"))
        return random.choice(diff_questions)
