import random
import re
from typing import Dict, List, Any


# =========================
# QUESTION BANK (UNCHANGED)
# =========================

GENERIC_TECH = {
    "easy": [
        "Explain {skill} to a junior engineer in simple terms.",
        "How have you used {skill} in one of your projects?",
        "What are common mistakes when starting with {skill}?",
    ],
    "medium": [
        "Design a scalable feature using {skill} for a {role} scenario.",
        "Compare two different approaches you used with {skill} and their trade-offs.",
        "Describe a debugging strategy for a production issue related to {skill}.",
    ],
    "hard": [
        "Describe a high-impact architecture decision involving {skill} and why you chose it.",
        "How would you optimize performance bottlenecks in a system built with {skill}?",
        "What failure scenarios do you plan for when using {skill} at scale?",
    ],
}

GENERIC_NON_TECH = {
    "easy": [
        "Tell me about yourself and why you are a good fit for {role}.",
        "Describe a project where your {skill} experience helped the team deliver value.",
        "How do you prioritize tasks during a busy week?",
    ],
    "medium": [
        "Describe a conflict at work and how you resolved it effectively.",
        "Tell me about a time you had to influence stakeholders without direct authority.",
        "How do you handle ambiguity while keeping delivery on track?",
    ],
    "hard": [
        "Describe a high-pressure decision and how you balanced people, risk, and outcomes.",
        "How do you coach underperforming teammates while maintaining delivery quality?",
        "Tell me about a strategic initiative you led and how you measured impact.",
    ],
}


class AIService:

    # ============================================
    # EXISTING HELPERS (UNCHANGED)
    # ============================================

    @staticmethod
    def _normalize_difficulty(difficulty: str) -> str:
        value = str(difficulty or "easy").strip().lower()
        return value if value in {"easy", "medium", "hard"} else "easy"

    @staticmethod
    def _extract_keywords(resume_data: Dict, role: str) -> List[str]:
        skills = resume_data.get("skills", []) if isinstance(resume_data, dict) else []

        role_tokens = re.findall(
            r"[A-Za-z\+.#]+",
            str(role or "Software Engineer")
        )

        role_tokens = [
            token.lower()
            for token in role_tokens
            if len(token) > 2
        ]

        normalized_skills = [
            str(skill).strip().lower()
            for skill in skills
            if str(skill).strip()
        ]

        keywords = list(dict.fromkeys(normalized_skills + role_tokens))

        return keywords[:8] if keywords else [
            "problem solving",
            "software design",
            "communication",
        ]

    # ============================================
    # QUESTION GENERATION (UNCHANGED)
    # ============================================

    @staticmethod
    def generate_questions(
        interview_type: str,
        resume_data: Dict,
        role: str,
        difficulty: str,
        asked_questions: List[str],
        count: int = 3,
    ) -> Dict:

        normalized_type = str(interview_type or "technical").strip().lower()
        level = AIService._normalize_difficulty(difficulty)

        keywords = AIService._extract_keywords(resume_data, role)

        templates = (
            GENERIC_NON_TECH[level]
            if normalized_type == "non-technical"
            else GENERIC_TECH[level]
        )

        asked_set = {str(q).strip() for q in (asked_questions or [])}

        generated = []

        max_attempts = max(10, count * 5)
        attempts = 0

        while len(generated) < count and attempts < max_attempts:

            skill = random.choice(keywords)
            template = random.choice(templates)

            question = template.format(skill=skill, role=role or "this role")

            if question not in asked_set:
                generated.append(
                    {
                        "question": question,
                        "type": normalized_type,
                        "difficulty": level,
                    }
                )

                asked_set.add(question)

            attempts += 1

        if not generated:
            generated.append(
                {
                    "question": (
                        "Tell me about one project you are most proud of "
                        "and the impact you created."
                    ),
                    "type": normalized_type,
                    "difficulty": level,
                }
            )

        return {"questions": generated}

    # ==========================================================
    # TASK 18 — ANSWER QUALITY CALCULATION
    # ==========================================================

    @staticmethod
    def _calculate_answer_quality(
        question: str,
        answer: str,
        resume_data: Dict,
    ) -> Dict[str, int]:

        answer_lower = answer.lower()

        keywords = AIService._extract_keywords(resume_data or {}, "")

        keyword_hits = sum(
            1 for keyword in keywords
            if keyword and keyword in answer_lower
        )

        relevance = min(100, 55 + keyword_hits * 12)

        word_count = len(answer.split())

        completeness = min(
            100,
            40 + int(word_count * 1.3)
        )

        technical_terms = len(
            re.findall(
                r"\b(api|database|python|react|node|sql|algorithm|model|backend|frontend|ai|ml|system|docker|mongodb)\b",
                answer_lower,
            )
        )

        technical_accuracy = min(
            100,
            45 + technical_terms * 8
        )

        examples = len(
            re.findall(
                r"\b(example|project|implemented|developed|built|created|used)\b",
                answer_lower,
            )
        )

        examples_clarity = min(
            100,
            45 + examples * 10 + int(word_count / 10)
        )

        return {
            "relevance": relevance,
            "completeness": completeness,
            "technical_accuracy": technical_accuracy,
            "examples_clarity": examples_clarity,
        }

    # ==========================================================
    # TASK 18 — COMMUNICATION METRICS (BACKEND READY)
    # ==========================================================

    @staticmethod
    def _calculate_communication_metrics(
        answer: str,
        transcript: str = "",
        duration_seconds: float | None = None,
    ) -> Dict[str, Any]:

        text = transcript.strip() if transcript else answer.strip()

        words = text.split()
        word_count = len(words)

        filler_words = re.findall(
            r"\b(um|uh|like|actually|basically|you know)\b",
            text.lower(),
        )

        filler_count = len(filler_words)

        speaking_pace = None

        if duration_seconds and duration_seconds > 0:
            speaking_pace = round(word_count / (duration_seconds / 60), 1)

        response_length = min(100, int(word_count * 1.2))

        clarity = max(
            40,
            min(
                100,
                100 - filler_count * 5 + int(word_count / 15),
            ),
        )

        score_components = [
            clarity,
            response_length,
        ]

        if speaking_pace:
            ideal = 140
            pace_score = max(
                50,
                100 - abs(speaking_pace - ideal) * 0.5,
            )

            score_components.append(int(pace_score))

        communication_score = int(sum(score_components) / len(score_components))

        return {
            "score": communication_score,
            "word_count": word_count,
            "response_length": response_length,
            "clarity": clarity,
            "filler_word_count": filler_count,
            "speaking_pace_wpm": speaking_pace,
        }

    # ==========================================================
    # EXISTING ANSWER EVALUATION + TASK 18 MERGE
    # ==========================================================

    @staticmethod
    def evaluate_answer(
        question: str,
        answer: str,
        resume_data: Dict,
        transcript: str = "",
        duration_seconds: float | None = None,
    ) -> Dict:

        answer_text = str(answer or "").strip()

        question_text = str(question or "").strip().lower()

        keywords = AIService._extract_keywords(resume_data or {}, "")

        answer_lower = answer_text.lower()

        # ----------------------------
        # EXISTING SCORE (PRESERVED)
        # ----------------------------

        length_score = min(len(answer_text.split()) / 40.0, 1.0) * 4

        keyword_hits = sum(
            1
            for keyword in keywords
            if keyword and keyword in answer_lower
        )

        keyword_score = min(keyword_hits / 3.0, 1.0) * 3

        relevance_score = (
            3
            if any(
                token in answer_lower
                for token in question_text.split()[:5]
            )
            else 1
        )

        score_10 = int(
            round(
                max(
                    0,
                    min(
                        10,
                        length_score + keyword_score + relevance_score,
                    ),
                )
            )
        )

        normalized_score = score_10 * 10

        if score_10 >= 8:
            feedback = (
                "Strong answer with good clarity, relevant examples, "
                "and solid technical explanation."
            )

        elif score_10 >= 5:
            feedback = (
                "Good explanation but improve structure, depth, "
                "and include more practical examples."
            )

        else:
            feedback = (
                "Answer is brief or generic. Include project examples, "
                "clear reasoning, and technical details."
            )

        # ----------------------------
        # NEW TASK 18 ANALYTICS
        # ----------------------------

        answer_quality = AIService._calculate_answer_quality(
            question,
            answer_text,
            resume_data,
        )

        communication = AIService._calculate_communication_metrics(
            answer_text,
            transcript,
            duration_seconds,
        )

        answer_quality_score = int(
            (
                answer_quality["relevance"]
                + answer_quality["completeness"]
                + answer_quality["technical_accuracy"]
                + answer_quality["examples_clarity"]
            )
            / 4
        )

        return {
            # Existing
            "score": score_10,
            "normalized_score": normalized_score,
            "feedback": feedback,

            # Task 18
            "answer_quality": {
                "score": answer_quality_score,
                **answer_quality,
            },

            "communication": communication,
        }