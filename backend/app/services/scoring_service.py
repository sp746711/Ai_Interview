from backend.app.utils.similarity import calculate_similarity

class ScoringService:
    @staticmethod
    def evaluate_test(answers: dict, test_questions: list) -> dict:
        score = 0
        total = len(test_questions)
        for q in test_questions:
            q_id = str(q.get("_id"))
            question_text = q.get("question")
            submitted_answer = answers.get(q_id) or answers.get(question_text)
            submitted_norm = str(submitted_answer or "").strip().lower()
            correct_norm = str(q.get("correct_answer") or "").strip().lower()
            if submitted_norm and submitted_norm == correct_norm:
                score += 1
        
        return {"score": score, "total": total}

    @staticmethod
    def evaluate_ai_answer(question: str, answer: str) -> int:
        similarity = calculate_similarity(question, answer)
        length_bonus = min(len(answer.split()) / 50, 1) * 0.2
        final_score = int((similarity + length_bonus) * 100)
        return min(final_score, 100)

    @staticmethod
    def calculate_final_score(resume_score: int, test_score_percent: int, ai_score: int) -> int:
        return int((resume_score * 0.3) + (test_score_percent * 0.3) + (ai_score * 0.4))

