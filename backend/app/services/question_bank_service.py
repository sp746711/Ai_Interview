import csv
import random
from pathlib import Path
from typing import Any, Dict, List


class QuestionBankService:
    """
    Loads domain-specific Round 3 interview questions from CSV files
    and randomly selects questions for one interview session.

    Q1 is a fixed introduction question.

    Q2-Q21 are selected randomly from the selected domain CSV and
    retain their evaluation metadata:
        - question_id
        - question
        - reference_answer
        - key_points
        - domain/category
        - evaluation_criteria
    """

    INTRODUCTION_QUESTION = "Tell me about yourself."

    QUESTION_BANK_DIR = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "question_banks"
    )

    DOMAIN_FILES: Dict[str, str] = {
        "Software Engineering": "software_engineering.csv",
        "Data Analytics": "data_analytics.csv",
        "Data Science": "data_science.csv",
        "AI/ML": "ai_ml.csv",
        "Full Stack Development": "full_stack.csv",
        "Frontend Development": "frontend.csv",
        "Backend Development": "backend.csv",
        "Cloud Computing": "cloud.csv",
        "DevOps": "devops.csv",
        "Cybersecurity": "cybersecurity.csv",
        "Data Engineering": "data_engineering.csv",
        "GenAI/LLM": "genai_llm.csv",
        "HR": "hr.csv",
        "Sales & Business Development": "sales_business_development.csv",
        "Digital Marketing": "digital_marketing.csv",
        "Business Analysis": "business_analysis.csv",
        "Project Management": "project_management.csv",
        "Operations Management": "operations_management.csv",
    }

    @classmethod
    def normalize_domain(cls, domain: str) -> str:
        """
        Normalize the selected domain so small formatting differences
        do not prevent the correct CSV from being found.
        """

        value = str(domain or "").strip()

        aliases = {
            "software engineering": "Software Engineering",
            "software_engineering": "Software Engineering",

            "data analytics": "Data Analytics",
            "data_analytics": "Data Analytics",

            "data science": "Data Science",
            "data_science": "Data Science",

            "ai/ml": "AI/ML",
            "ai ml": "AI/ML",
            "ai_ml": "AI/ML",
            "artificial intelligence and machine learning": "AI/ML",

            "full stack": "Full Stack Development",
            "full stack development": "Full Stack Development",
            "full_stack": "Full Stack Development",

            "frontend": "Frontend Development",
            "frontend development": "Frontend Development",
            "front end development": "Frontend Development",
            "frontend_development": "Frontend Development",

            "backend": "Backend Development",
            "backend development": "Backend Development",
            "back end development": "Backend Development",
            "backend_development": "Backend Development",

            "cloud": "Cloud Computing",
            "cloud computing": "Cloud Computing",

            "devops": "DevOps",

            "cybersecurity": "Cybersecurity",
            "cyber security": "Cybersecurity",

            "data engineering": "Data Engineering",
            "data_engineering": "Data Engineering",

            "genai/llm": "GenAI/LLM",
            "genai": "GenAI/LLM",
            "gen ai": "GenAI/LLM",
            "llm": "GenAI/LLM",
            "genai_llm": "GenAI/LLM",

            "hr": "HR",
            "human resources": "HR",

            "sales & business development": (
                "Sales & Business Development"
            ),
            "sales and business development": (
                "Sales & Business Development"
            ),
            "sales_business_development": (
                "Sales & Business Development"
            ),

            "digital marketing": "Digital Marketing",
            "digital_marketing": "Digital Marketing",

            "business analysis": "Business Analysis",
            "business_analysis": "Business Analysis",

            "project management": "Project Management",
            "project_management": "Project Management",

            "operations management": "Operations Management",
            "operations_management": "Operations Management",
        }

        return aliases.get(
            value.lower(),
            value,
        )

    @classmethod
    def get_csv_path(cls, domain: str) -> Path:
        """
        Return the CSV path for the selected domain.
        """

        normalized_domain = cls.normalize_domain(domain)

        filename = cls.DOMAIN_FILES.get(
            normalized_domain
        )

        if not filename:
            raise ValueError(
                f"Unsupported interview domain: {domain}"
            )

        csv_path = cls.QUESTION_BANK_DIR / filename

        if not csv_path.exists():
            raise FileNotFoundError(
                f"Question bank CSV not found: {csv_path}"
            )

        return csv_path

    @classmethod
    def load_question_records(
        cls,
        domain: str,
    ) -> List[Dict[str, Any]]:
        """
        Load complete question records from the selected domain CSV.

        Unlike load_questions(), this preserves the evaluation metadata
        required by the AI evaluator.
        """

        csv_path = cls.get_csv_path(domain)

        records: List[Dict[str, Any]] = []

        with csv_path.open(
            "r",
            encoding="utf-8-sig",
            newline="",
        ) as file:

            reader = csv.DictReader(file)

            if not reader.fieldnames:
                raise ValueError(
                    f"Question bank is missing CSV headers: "
                    f"{csv_path.name}"
                )

            required_columns = {
                "question",
                "reference_answer",
                "key_points",
                "evaluation_criteria",
            }

            missing_columns = [
                column
                for column in required_columns
                if column not in reader.fieldnames
            ]

            if missing_columns:
                raise ValueError(
                    f"Question bank '{csv_path.name}' is missing "
                    f"required columns: {missing_columns}"
                )

            for row in reader:

                question = str(
                    row.get("question", "") or ""
                ).strip()

                if not question:
                    continue

                record = {
                    "question_id": str(
                        row.get("question_id", "") or ""
                    ).strip(),

                    "question": question,

                    "reference_answer": str(
                        row.get("reference_answer", "") or ""
                    ).strip(),

                    "key_points": str(
                        row.get("key_points", "") or ""
                    ).strip(),

                    "domain": str(
                        row.get("domain/category", "") or ""
                    ).strip(),

                    "evaluation_criteria": str(
                        row.get("evaluation_criteria", "") or ""
                    ).strip(),

                    "question_type": "csv",
                }

                records.append(record)

        if len(records) < 20:
            raise ValueError(
                f"Question bank '{csv_path.name}' contains "
                f"only {len(records)} valid questions. "
                f"At least 20 are required."
            )

        return records

    @classmethod
    def load_questions(cls, domain: str) -> List[str]:
        """
        Backward-compatible method.

        Returns only question text from the selected CSV.
        Existing code that uses load_questions() will continue to work.
        """

        records = cls.load_question_records(domain)

        return [
            record["question"]
            for record in records
        ]

    @classmethod
    def get_introduction_record(
        cls,
        domain: str,
    ) -> Dict[str, Any]:
        """
        Return the evaluation context for Q1.

        Q1 has no reference answer because every candidate's
        professional introduction is naturally different.

        It is evaluated using the candidate's resume/profile,
        selected interview domain, and the introduction rubric.
        """

        normalized_domain = cls.normalize_domain(domain)

        return {
            "question_id": "INTRO",
            "question": cls.INTRODUCTION_QUESTION,
            "reference_answer": "",
            "key_points": (
                "professional background; "
                "education or relevant experience; "
                "skills relevant to the selected domain; "
                "relevant projects or achievements; "
                "career direction or role alignment"
            ),
            "domain": normalized_domain,
            "evaluation_criteria": (
                "Evaluate the candidate's professional self-introduction "
                "using their resume/profile and selected interview domain. "
                "Assess relevance, completeness, professional alignment, "
                "clarity, structure, confidence, and conciseness. "
                "Do not expect a fixed or exact answer. "
                "Reward relevant information from the candidate's actual "
                "background and penalize irrelevant, vague, excessively "
                "short, or unnecessarily long responses."
            ),
            "question_type": "introduction",
        }

    @classmethod
    def create_interview_question_records(
        cls,
        domain: str,
        question_count: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Create the complete Round 3 question sequence with
        evaluation metadata.

        Q1:
            Fixed introduction question.

        Q2-Q21:
            Random questions from the selected domain CSV.

        CSV questions are selected without replacement, so there
        are no duplicate questions within one interview.
        """

        if question_count <= 0:
            raise ValueError(
                "question_count must be greater than zero."
            )

        normalized_domain = cls.normalize_domain(domain)

        records = cls.load_question_records(
            normalized_domain
        )

        if len(records) < question_count:
            raise ValueError(
                f"Not enough questions available for "
                f"domain '{normalized_domain}'."
            )

        selected_records = random.sample(
            records,
            question_count,
        )

        introduction_record = cls.get_introduction_record(
            normalized_domain
        )

        return [
            introduction_record,
            *selected_records,
        ]

    @classmethod
    def create_interview_questions(
        cls,
        domain: str,
        question_count: int = 20,
    ) -> List[str]:
        """
        Backward-compatible method.

        Returns only the question text while the new
        create_interview_question_records() method preserves
        the evaluation metadata.
        """

        records = cls.create_interview_question_records(
            domain=domain,
            question_count=question_count,
        )

        return [
            record["question"]
            for record in records
        ]