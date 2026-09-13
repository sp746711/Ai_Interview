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
    # TASK 18 — QUESTION-AWARE ANSWER QUALITY
    # ==========================================================

    @staticmethod
    def _tokenize(value: str) -> List[str]:
        """Normalize text into useful comparison tokens."""
        text = str(value or "").lower()
        text = re.sub(r"[^a-z0-9+#.\s]", " ", text)
        tokens = re.findall(r"[a-z0-9+#.]+", text)

        stop_words = {
            "the", "a", "an", "and", "or", "but", "if", "then",
            "than", "that", "this", "these", "those", "to", "of",
            "in", "on", "for", "from", "with", "by", "as", "at",
            "is", "are", "was", "were", "be", "been", "being",
            "it", "its", "i", "me", "my", "we", "our", "you",
            "your", "they", "their", "he", "she", "his", "her",
            "how", "what", "why", "when", "where", "which", "who",
            "do", "does", "did", "can", "could", "would", "should",
            "will", "have", "has", "had", "about", "into", "also",
        }

        return [token for token in tokens if token not in stop_words and len(token) > 1]

    @staticmethod
    def _text_similarity(left: str, right: str) -> float:
        """Return approximate content similarity without exact-answer matching."""
        left_tokens = set(AIService._tokenize(left))
        right_tokens = set(AIService._tokenize(right))

        if not left_tokens or not right_tokens:
            return 0.0

        intersection = len(left_tokens & right_tokens)
        union = len(left_tokens | right_tokens)
        return intersection / union if union else 0.0

    @staticmethod
    def _coverage_score(answer: str, expected_items: List[str]) -> int:
        """Measure how many expected concepts are represented in the answer."""
        if not expected_items:
            return 0

        answer_tokens = set(AIService._tokenize(answer))
        covered = 0

        for item in expected_items:
            item_tokens = set(AIService._tokenize(item))
            if not item_tokens:
                continue

            overlap = len(answer_tokens & item_tokens) / len(item_tokens)

            # A concept is considered covered when a meaningful part of its
            # wording appears in the answer. This allows paraphrasing and
            # does not require an exact reference-answer match.
            if overlap >= 0.30 or any(
                token in answer_tokens
                for token in item_tokens
                if len(token) >= 5
            ):
                covered += 1

        return int(round((covered / len(expected_items)) * 100))

    @staticmethod
    def _split_key_points(value: Any) -> List[str]:
        """Convert CSV key_points into individual evaluation concepts."""
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]

        text = str(value or "").strip()
        if not text:
            return []

        parts = re.split(r"[;|\n]+", text)
        return [part.strip() for part in parts if part.strip()]

    @staticmethod
    def _extract_resume_text(resume_data: Dict) -> str:
        """Flatten useful resume/profile information for Q1 evaluation."""
        if not isinstance(resume_data, dict):
            return ""

        pieces: List[str] = []

        def collect(value: Any) -> None:
            if value is None:
                return
            if isinstance(value, dict):
                for nested in value.values():
                    collect(nested)
            elif isinstance(value, list):
                for nested in value:
                    collect(nested)
            else:
                text = str(value).strip()
                if text:
                    pieces.append(text)

        collect(resume_data)
        return " ".join(pieces)

    @staticmethod
    def _calculate_answer_quality(
        question: str,
        answer: str,
        resume_data: Dict,
        question_context: Dict | None = None,
    ) -> Dict[str, int]:
        """
        Calculate question-aware answer quality for technical and
        non-technical interviews.

        Q1 (question_type='introduction') is evaluated against the
        candidate's resume and selected domain because it has no single
        correct reference answer.

        Q2-Q21 use the CSV reference_answer, key_points and
        evaluation_criteria as evaluation guidance.
        """

        context = question_context if isinstance(question_context, dict) else {}
        answer_text = str(answer or "").strip()
        answer_lower = answer_text.lower()
        question_type = str(context.get("question_type", "csv")).strip().lower()

        word_count = len(answer_text.split())
        resume_text = AIService._extract_resume_text(resume_data or {})

        # ------------------------------------------------------
        # Q1 — PROFESSIONAL INTRODUCTION
        # ------------------------------------------------------
        if question_type == "introduction" or question.strip().lower() == "tell me about yourself.":
            domain = str(context.get("domain", "")).strip()

            resume_similarity = AIService._text_similarity(
                answer_text,
                resume_text,
            )

            domain_tokens = set(AIService._tokenize(domain))
            answer_tokens = set(AIService._tokenize(answer_text))
            domain_alignment = (
                100
                if domain_tokens and domain_tokens & answer_tokens
                else 60
            )

            introduction_points = [
                "professional background",
                "education or relevant experience",
                "skills relevant to the selected domain",
                "relevant projects or achievements",
                "career direction or role alignment",
            ]

            coverage = AIService._coverage_score(
                answer_text,
                introduction_points,
            )

            relevance = int(
                round(
                    min(100, 45 + resume_similarity * 110) * 0.65
                    + domain_alignment * 0.35
                )
            )

            completeness = min(100, 35 + int(word_count * 1.4))
            completeness = max(30, completeness)

            professional_terms = len(
                re.findall(
                    r"\b(experience|education|student|developer|engineer|project|internship|skills|worked|developed|built|responsible|achievement|career|role|team|company)\b",
                    answer_lower,
                    re.VERBOSE,
                )
            )

            examples_clarity = min(100, 45 + professional_terms * 5 + int(word_count / 8))

            # For Q1 this field means professional/background accuracy, not
            # technical correctness.
            professional_alignment = min(100, int(coverage * 0.7 + domain_alignment * 0.3))

            return {
                "relevance": relevance,
                "completeness": completeness,
                "technical_accuracy": professional_alignment,
                "examples_clarity": examples_clarity,
            }

        # ------------------------------------------------------
        # Q2-Q21 — CSV QUESTION EVALUATION
        # ------------------------------------------------------
        reference_answer = str(
            context.get("reference_answer", "") or ""
        ).strip()

        key_points = AIService._split_key_points(
            context.get("key_points", "")
        )

        evaluation_criteria = str(
            context.get("evaluation_criteria", "") or ""
        ).strip()

        reference_similarity = AIService._text_similarity(
            answer_text,
            reference_answer,
        )

        key_point_coverage = AIService._coverage_score(
            answer_text,
            key_points,
        )

        criteria_similarity = AIService._text_similarity(
            answer_text,
            evaluation_criteria,
        )

        question_similarity = AIService._text_similarity(
            answer_text,
            question,
        )

        # Relevance is primarily driven by the expected concepts, with
        # reference/criteria similarity providing additional evidence.
        relevance = int(
            round(
                key_point_coverage * 0.55
                + reference_similarity * 100 * 0.30
                + question_similarity * 100 * 0.15
            )
        )

        completeness = min(100, 35 + int(word_count * 1.25))
        if key_points:
            completeness = int(
                round(completeness * 0.45 + key_point_coverage * 0.55)
            )

        # Accuracy is based on expected concepts rather than a fixed list
        # of technical words, so the same evaluator works for HR, Sales,
        # Marketing, BA, PM, Operations and technical domains.
        accuracy = int(
            round(
                key_point_coverage * 0.60
                + reference_similarity * 100 * 0.30
                + criteria_similarity * 100 * 0.10
            )
        )

        example_indicators = len(
            re.findall(
                r"\b(example|for instance|project|implemented|developed|built|created|used|experience|result|impact|outcome|achieved|measured|improved|increased|reduced|resolved)\b",
                answer_lower,
                re.VERBOSE,
            )
        )

        examples_clarity = min(
            100,
            40
            + example_indicators * 8
            + int(word_count / 10)
            + int(criteria_similarity * 20),
        )

        return {
            "relevance": max(0, min(100, relevance)),
            "completeness": max(0, min(100, completeness)),
            "technical_accuracy": max(0, min(100, accuracy)),
            "examples_clarity": max(0, min(100, examples_clarity)),
        }

    @staticmethod
    def _build_answer_feedback(
        score_10: int,
        answer_quality: Dict[str, int],
        question_context: Dict | None = None,
    ) -> str:
        """Create feedback from the actual evaluated answer metrics."""
        context = question_context if isinstance(question_context, dict) else {}
        is_intro = str(context.get("question_type", "")).lower() == "introduction"

        relevance = answer_quality.get("relevance", 0)
        completeness = answer_quality.get("completeness", 0)
        accuracy = answer_quality.get("technical_accuracy", 0)
        clarity = answer_quality.get("examples_clarity", 0)

        if score_10 >= 8:
            opening = "Strong answer."
        elif score_10 >= 5:
            opening = "Good answer, but there is room for improvement."
        else:
            opening = "The answer needs more depth and structure."

        if is_intro:
            focus = []
            if relevance < 65:
                focus.append("connect your introduction more clearly to your background and the selected domain")
            if completeness < 65:
                focus.append("include your relevant education, skills, projects, or experience")
            if clarity < 65:
                focus.append("keep the introduction structured and concise")

            if focus:
                return opening + " To improve, " + "; ".join(focus) + "."

            return opening + " Your introduction is relevant and professionally aligned with the interview."

        focus = []
        if relevance < 65:
            focus.append("address more of the key points expected by the question")
        if completeness < 65:
            focus.append("provide a more complete explanation")
        if accuracy < 65:
            focus.append("strengthen the accuracy of the concepts and reasoning")
        if clarity < 65:
            focus.append("add a concrete example, result, or practical explanation where appropriate")

        if focus:
            return opening + " To improve, " + "; ".join(focus) + "."

        return opening + " The response covers the important concepts and is reasonably clear and complete."

    # ==========================================================
    # QUESTION-AWARE ANSWER EVALUATION + TASK 18 MERGE
    # ==========================================================

    @staticmethod
    def evaluate_answer(
        question: str,
        answer: str,
        resume_data: Dict,
        transcript: str = "",
        duration_seconds: float | None = None,
        question_context: Dict | None = None,
    ) -> Dict:
        """
        Evaluate one Round 3 answer.

        Q1 uses resume/domain-aware professional-introduction evaluation.
        Q2-Q21 use the selected CSV question's reference answer, key
        points and evaluation criteria.

        The evaluator does not require an exact wording match.
        """

        answer_text = str(answer or "").strip()
        context = question_context if isinstance(question_context, dict) else {}

        answer_quality = AIService._calculate_answer_quality(
            question,
            answer_text,
            resume_data or {},
            context,
        )

        # Keep the existing 10-point / 100-point API contract. The score is
        # now based on question-aware answer quality instead of hardcoded
        # technical keywords.
        score_100 = int(
            round(
                answer_quality["relevance"] * 0.35
                + answer_quality["completeness"] * 0.25
                + answer_quality["technical_accuracy"] * 0.25
                + answer_quality["examples_clarity"] * 0.15
            )
        )

        score_100 = max(0, min(100, score_100))
        score_10 = int(round(score_100 / 10))
        score_10 = max(0, min(10, score_10))
        normalized_score = score_10 * 10

        feedback = AIService._build_answer_feedback(
            score_10,
            answer_quality,
            context,
        )

        communication = AIService._calculate_communication_metrics(
            answer_text,
            transcript,
            duration_seconds,
        )

        answer_quality_score = int(
            round(
                (
                    answer_quality["relevance"]
                    + answer_quality["completeness"]
                    + answer_quality["technical_accuracy"]
                    + answer_quality["examples_clarity"]
                )
                / 4
            )
        )

        return {
            "score": score_10,
            "normalized_score": normalized_score,
            "feedback": feedback,
            "answer_quality": {
                "score": answer_quality_score,
                **answer_quality,
            },
            "communication": communication,
        }
