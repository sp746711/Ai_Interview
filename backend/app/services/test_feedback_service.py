import json
import re
import httpx
from typing import Any


# ============================================================
# TASK 16 — HELPER FUNCTIONS
# ============================================================

def _extract_json(raw_output: str) -> dict:
    """
    Safely extract a JSON object from Qwen output.

    Handles:
    1. Normal JSON
    2. JSON surrounded by extra text
    3. Markdown ```json code fences
    """

    if not isinstance(raw_output, str):
        raise ValueError("Qwen output is not a string.")

    text = raw_output.strip()

    # Remove markdown code fences if Qwen returns them.
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    # --------------------------------------------------------
    # First attempt: direct JSON parsing
    # --------------------------------------------------------

    try:
        data = json.loads(text)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Second attempt: find JSON object inside extra text
    # --------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]

        try:
            data = json.loads(candidate)

            if isinstance(data, dict):
                return data

        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Could not parse Qwen JSON response: {exc}"
            ) from exc

    raise ValueError(
        "Qwen did not return a valid JSON object."
    )


def _clean_list(
    value: Any,
    limit: int = 5,
) -> list[str]:
    """
    Clean AI-generated list values.
    """

    if not isinstance(value, list):
        return []

    cleaned = []

    for item in value:

        if isinstance(item, str):

            item = item.strip()

            if item:
                cleaned.append(item)

        elif item is not None:

            item = str(item).strip()

            if item:
                cleaned.append(item)

    return cleaned[:limit]


# ============================================================
# TASK 16 — OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:4b"
OLLAMA_TIMEOUT = 180.0


# ============================================================
# TASK 16 — GENERATE TEST FEEDBACK
# ============================================================

async def generate_test_feedback(
    round2_result: dict,
    interview_type: str = "technical",
) -> dict:
    """
    TASK 16 ONLY.

    Generates personalized Round 2 AI feedback from the ACTUAL
    Round 2 result saved by TestController.

    No Round 1 / Round 3 / UI / interview-flow changes.
    """

    # ========================================================
    # SAFETY CHECK
    # ========================================================

    if not isinstance(round2_result, dict):
        round2_result = {}

    # ========================================================
    # REAL ROUND 2 DATA
    # ========================================================

    category_scores = round2_result.get(
        "category_scores",
        {},
    )

    if not isinstance(category_scores, dict):
        category_scores = {}

    question_results = round2_result.get(
        "question_results",
        [],
    )

    if not isinstance(question_results, list):
        question_results = []

    total_questions = round2_result.get(
        "total_questions",
        50,
    )

    # --------------------------------------------------------
    # Current TestController fields:
    #
    # correct_answers
    # incorrect_answers
    # skipped_answers
    #
    # Old field names remain as compatibility fallback.
    # --------------------------------------------------------

    correct = round2_result.get(
        "correct_answers",
        round2_result.get(
            "correct",
            0,
        ),
    )

    incorrect = round2_result.get(
        "incorrect_answers",
        round2_result.get(
            "incorrect",
            0,
        ),
    )

    skipped = round2_result.get(
        "skipped_answers",
        round2_result.get(
            "skipped",
            0,
        ),
    )

    test_score = round2_result.get(
        "score",
        round2_result.get(
            "test_score",
            round2_result.get(
                "percentage",
                0,
            ),
        ),
    )

    # ========================================================
    # REAL TASK 16 TIME DATA
    # ========================================================

    average_time = round2_result.get(
        "average_time_seconds",
        round2_result.get(
            "average_time",
            round2_result.get(
                "average_time_per_question",
                0,
            ),
        ),
    )

    fastest_time = round2_result.get(
        "fastest_time",
        round2_result.get(
            "fastest_average_time",
            0,
        ),
    )

    slowest_time = round2_result.get(
        "slowest_time",
        round2_result.get(
            "slowest_average_time",
            0,
        ),
    )

    time_efficiency = round2_result.get(
        "time_efficiency",
        0,
    )

    # ========================================================
    # SAFE NUMBERS
    # ========================================================

    try:
        total_questions = int(total_questions or 0)
    except (TypeError, ValueError):
        total_questions = 0

    try:
        correct = int(correct or 0)
    except (TypeError, ValueError):
        correct = 0

    try:
        incorrect = int(incorrect or 0)
    except (TypeError, ValueError):
        incorrect = 0

    try:
        skipped = int(skipped or 0)
    except (TypeError, ValueError):
        skipped = 0

    try:
        test_score = float(test_score or 0)
    except (TypeError, ValueError):
        test_score = 0

    try:
        average_time = float(average_time or 0)
    except (TypeError, ValueError):
        average_time = 0

    try:
        fastest_time = float(fastest_time or 0)
    except (TypeError, ValueError):
        fastest_time = 0

    try:
        slowest_time = float(slowest_time or 0)
    except (TypeError, ValueError):
        slowest_time = 0

    try:
        time_efficiency = float(time_efficiency or 0)
    except (TypeError, ValueError):
        time_efficiency = 0

    # ========================================================
    # DEBUG
    # ========================================================

    print(
        "\n========== TASK 16 REAL ROUND 2 DATA =========="
    )

    print("Total:", total_questions)
    print("Correct:", correct)
    print("Incorrect:", incorrect)
    print("Skipped:", skipped)
    print("Score:", test_score)
    print("Average Time:", average_time)
    print("Fastest Time:", fastest_time)
    print("Slowest Time:", slowest_time)
    print("Time Efficiency:", time_efficiency)
    print("Categories:", category_scores)
    print("Question Results:", len(question_results))

    print(
        "===============================================\n"
    )

    # ========================================================
    # QWEN PROMPT
    # ========================================================

    prompt = f"""
You are an AI assessment feedback engine.

Analyze ONLY the candidate's REAL Round 2 assessment data.

Interview type:
{interview_type}

Total questions:
{total_questions}

Correct answers:
{correct}

Incorrect answers:
{incorrect}

Skipped answers:
{skipped}

Overall score:
{test_score}

Average time per answered question:
{average_time} seconds

Fastest answered-question time:
{fastest_time} seconds

Slowest answered-question time:
{slowest_time} seconds

Time efficiency:
{time_efficiency}%

Category performance:
{json.dumps(category_scores, ensure_ascii=False)}

Question-by-question results:
{json.dumps(question_results, ensure_ascii=False)}


============================================================
YOUR TASK
============================================================

Generate personalized feedback based ONLY on the supplied
Round 2 performance.

The feedback must reflect this candidate's actual performance.

Use:
- correct answers
- incorrect answers
- skipped answers
- score
- category performance
- question results
- timing
- time efficiency


============================================================
STRICT RULES
============================================================

1. Do not invent scores.

2. Do not change any supplied numbers.

3. Do not invent categories.

4. Do not invent question results.

5. Do not use Round 1 data.

6. Do not use Round 3 data.

7. Do not use resume data.

8. Do not give the same generic feedback for every candidate.

9. Strengths must come from areas where the candidate actually
   performed relatively well.

10. Improvement areas must come from actual weaknesses.

11. Skipped questions must influence the feedback when relevant.

12. Category feedback must use the supplied category scores.

13. Timing feedback must use the supplied timing values when useful.

14. Recommendations must directly address the candidate's
    actual weaknesses.

15. Every strength must explain WHY it is a strength.

16. Every improvement area must explain WHAT needs improvement
    and WHY.

17. Every recommendation must explain WHAT the candidate should do.

18. Return exactly 5 strengths.

19. Return exactly 5 areas_to_improve.

20. Return exactly 5 recommendations.

21. Each item must be a complete meaningful sentence.

22. Do not mention ATS.

23. Do not calculate ATS.

24. Do not return markdown.

25. Return ONLY valid JSON.


============================================================
REQUIRED JSON
============================================================

{{
    "strengths": [
        "Personalized strength based on the actual Round 2 data.",
        "Personalized strength based on the actual Round 2 data.",
        "Personalized strength based on the actual Round 2 data.",
        "Personalized strength based on the actual Round 2 data.",
        "Personalized strength based on the actual Round 2 data."
    ],

    "areas_to_improve": [
        "Personalized improvement area based on actual performance.",
        "Personalized improvement area based on actual performance.",
        "Personalized improvement area based on actual performance.",
        "Personalized improvement area based on actual performance.",
        "Personalized improvement area based on actual performance."
    ],

    "recommendations": [
        "Specific recommendation based on actual performance.",
        "Specific recommendation based on actual performance.",
        "Specific recommendation based on actual performance.",
        "Specific recommendation based on actual performance.",
        "Specific recommendation based on actual performance."
    ],

    "assessment_summary":
        "Personalized summary of this candidate's actual Round 2 performance."
}}
""".strip()

    # ========================================================
    # OLLAMA PAYLOAD
    # ========================================================

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "format": "json",

        # Qwen3 structured-output configuration
        "think": False,

        "keep_alive": "10m",

        "options": {
            "temperature": 0.2,
            "num_predict": 1800,
            "num_ctx": 8192,
        },
    }

    # ========================================================
    # CALL OLLAMA
    # ========================================================

    try:

        timeout = httpx.Timeout(
            connect=10.0,
            read=OLLAMA_TIMEOUT,
            write=30.0,
            pool=10.0,
        )

        async with httpx.AsyncClient(
            timeout=timeout
        ) as client:

            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json=payload,
            )

            response.raise_for_status()

            ollama_data = response.json()

        # ====================================================
        # NORMAL QWEN RESPONSE
        # ====================================================

        raw_output = (
            ollama_data.get(
                "response",
                "",
            )
            or ""
        )

        # ====================================================
        # QWEN3 THINKING FALLBACK
        # ====================================================

        if not raw_output:

            thinking_output = ollama_data.get(
                "thinking",
                "",
            )

            if isinstance(
                thinking_output,
                dict,
            ):

                raw_output = json.dumps(
                    thinking_output,
                    ensure_ascii=False,
                )

            else:

                raw_output = str(
                    thinking_output or ""
                ).strip()

        if not raw_output:

            raise RuntimeError(
                "Qwen returned no usable feedback."
            )

        # ====================================================
        # PARSE JSON
        # ====================================================

        result = _extract_json(
            raw_output
        )

        # ====================================================
        # CLEAN OUTPUT
        # ====================================================

        strengths = _clean_list(
            result.get(
                "strengths",
                [],
            ),
            5,
        )

        areas_to_improve = _clean_list(
            result.get(
                "areas_to_improve",
                result.get(
                    "weaknesses",
                    [],
                ),
            ),
            5,
        )

        recommendations = _clean_list(
            result.get(
                "recommendations",
                result.get(
                    "suggestions",
                    [],
                ),
            ),
            5,
        )

        summary = result.get(
            "assessment_summary",
            "",
        )

        if not isinstance(
            summary,
            str,
        ):

            summary = str(summary)

        summary = summary.strip()

        # ====================================================
        # VALIDATE
        # ====================================================

        if len(strengths) < 5:

            raise RuntimeError(
                f"Qwen returned only {len(strengths)} strengths."
            )

        if len(areas_to_improve) < 5:

            raise RuntimeError(
                "Qwen returned fewer than 5 improvement areas."
            )

        if len(recommendations) < 5:

            raise RuntimeError(
                "Qwen returned fewer than 5 recommendations."
            )

        if not summary:

            raise RuntimeError(
                "Qwen returned no assessment summary."
            )

        # ====================================================
        # SUCCESS
        # ====================================================

        print(
            "TASK 16 QWEN STATUS: SUCCESS"
        )

        return {
            "strengths": strengths,

            "weaknesses": areas_to_improve,

            "suggestions": recommendations,

            "recommendations": recommendations,

            "assessment_summary": summary,

            "llm_status": "success",

            "llm_error": "",
        }

    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as exc:

        print(
            "TASK 16 QWEN ERROR:",
            str(exc),
        )

        return {
            "strengths": [],

            "weaknesses": [],

            "suggestions": [],

            "recommendations": [],

            "assessment_summary": "",

            "llm_status": "error",

            "llm_error": str(exc),
        }