import json
import re
import httpx
from typing import Any


# ============================================================
# OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:4b"
OLLAMA_TIMEOUT = 180.0


# ============================================================
# SAFE JSON EXTRACTION
# ============================================================

def _extract_json(raw_output: str) -> dict:
    if not raw_output:
        raise RuntimeError("LLM returned an empty response.")

    text = raw_output.strip()

    # --------------------------------------------------------
    # Direct JSON
    # --------------------------------------------------------

    try:
        data = json.loads(text)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Remove markdown code fences
    # --------------------------------------------------------

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

    text = text.strip()

    # --------------------------------------------------------
    # JSON after removing code fence
    # --------------------------------------------------------

    try:
        data = json.loads(text)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Find JSON object inside additional text
    # --------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end > start:

        try:
            data = json.loads(
                text[start:end + 1]
            )

            if isinstance(data, dict):
                return data

        except json.JSONDecodeError:
            pass

    raise RuntimeError(
        "LLM did not return valid JSON."
    )


# ============================================================
# CLEAN LIST
# ============================================================

def _clean_list(
    value: Any,
    limit: int = 5,
) -> list[str]:

    if not isinstance(value, list):
        return []

    result = []

    for item in value:

        if isinstance(item, dict):

            text = (
                item.get("text")
                or item.get("recommendation")
                or item.get("message")
                or item.get("reason")
                or item.get("area")
                or item.get("strength")
            )

        else:
            text = item

        if text is None:
            continue

        text = str(text).strip()

        if not text:
            continue

        if text not in result:
            result.append(text)

        if len(result) >= limit:
            break

    return result


# ============================================================
# LLM FEEDBACK
# ============================================================

async def generate_test_feedback(
    round2_result: dict,
    interview_type: str = "technical",
) -> dict:

    if not isinstance(round2_result, dict):
        round2_result = {}

    # ========================================================
    # ROUND 2 DATA
    # ========================================================

    category_scores = round2_result.get(
        "category_scores",
        {},
    )

    question_results = round2_result.get(
        "question_results",
        [],
    )

    total_questions = round2_result.get(
        "total_questions",
        50,
    )

    # ========================================================
    # REAL ROUND 2 PERFORMANCE DATA
    # TASK 16 ONLY
    # ========================================================
    # Current Round 2 records use:
    #   correct_answers
    #   incorrect_answers
    #   skipped_answers
    #
    # Keep fallback support for older records that use:
    #   correct / incorrect / skipped

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

    average_time = round2_result.get(
        "average_time",
        0,
    )

    fastest_time = round2_result.get(
        "fastest_time",
        0,
    )

    slowest_time = round2_result.get(
        "slowest_time",
        0,
    )

    time_efficiency = round2_result.get(
        "time_efficiency",
        0,
    )

    # ========================================================
    # LLM PROMPT
    # ========================================================

    prompt = f"""
You are an AI assessment feedback engine.

Analyze the REAL Round 2 assessment data below.

Interview type:
{interview_type}

Total questions:
{total_questions}

Correct:
{correct}

Incorrect:
{incorrect}

Skipped:
{skipped}

Score:
{test_score}

Average time per answered question:
{average_time}

Fastest answered-question time:
{fastest_time}

Slowest answered-question time:
{slowest_time}

Time efficiency:
{time_efficiency}

Category scores:
{json.dumps(category_scores, ensure_ascii=False)}

Question results:
{json.dumps(question_results, ensure_ascii=False)}


============================================================
YOUR TASK
============================================================

Generate detailed, personalized Round 2 feedback based ONLY
on the supplied assessment data.


============================================================
IMPORTANT RULES
============================================================

- Analyze ONLY the supplied Round 2 data.
- Do not invent scores.
- Do not change any supplied numbers.
- Do not invent categories.
- Do not invent question results.
- Skipped questions must remain skipped.
- Use the actual category performance.
- Use the actual correct, incorrect and skipped counts.
- Use the actual timing information when relevant.
- Identify strengths from areas where the candidate performed
  relatively well.
- Identify weaknesses from areas where the candidate performed
  relatively poorly.
- Consider skipped questions when identifying improvement areas.
- Consider category-level performance.
- Consider accuracy.
- Consider timing only when it provides useful insight.
- Recommendations must directly address the identified
  weaknesses.
- Recommendations must be practical and specific.
- Do not calculate an ATS score.
- Do not mention ATS.
- Do not give generic empty feedback.
- Do not use short generic labels such as:
  "Technical Concepts"
  "Aptitude Concepts"
  "Reasoning Concepts"
  unless they are expanded into meaningful detailed sentences.
- Every strength must explain WHY it is a strength.
- Every improvement point must explain WHAT needs improvement
  and WHY.
- Every recommendation must explain WHAT the candidate should
  do.
- Avoid repeating the same idea with different wording.
- Return exactly 5 strengths.
- Return exactly 5 areas_to_improve.
- Return exactly 5 recommendations.
- Each item must be a complete, meaningful sentence.
- Keep the feedback personalized to the supplied data.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not add explanations outside JSON.


============================================================
REQUIRED OUTPUT
============================================================

Return exactly this JSON structure:

{{
  "strengths": [
    "Detailed strength 1 based on the actual assessment data.",
    "Detailed strength 2 based on the actual assessment data.",
    "Detailed strength 3 based on the actual assessment data.",
    "Detailed strength 4 based on the actual assessment data.",
    "Detailed strength 5 based on the actual assessment data."
  ],

  "areas_to_improve": [
    "Detailed improvement area 1 based on the actual assessment data.",
    "Detailed improvement area 2 based on the actual assessment data.",
    "Detailed improvement area 3 based on the actual assessment data.",
    "Detailed improvement area 4 based on the actual assessment data.",
    "Detailed improvement area 5 based on the actual assessment data."
  ],

  "recommendations": [
    "Detailed practical recommendation 1 directly addressing the assessment.",
    "Detailed practical recommendation 2 directly addressing the assessment.",
    "Detailed practical recommendation 3 directly addressing the assessment.",
    "Detailed practical recommendation 4 directly addressing the assessment.",
    "Detailed practical recommendation 5 directly addressing the assessment."
  ],

  "assessment_summary": "A detailed personalized summary of the candidate's Round 2 performance based only on the supplied data."
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
        # GET NORMAL RESPONSE
        # ====================================================

        raw_output = (
            ollama_data.get("response")
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

        # ====================================================
        # EXTRACT JSON
        # ====================================================

        result = _extract_json(
            raw_output
        )

        # ====================================================
        # CLEAN STRENGTHS
        # ====================================================

        strengths = _clean_list(
            result.get("strengths"),
            5,
        )

        # ====================================================
        # CLEAN AREAS TO IMPROVE
        # ====================================================

        areas_to_improve = _clean_list(
            result.get("areas_to_improve"),
            5,
        )

        # ====================================================
        # CLEAN RECOMMENDATIONS
        # ====================================================

        recommendations = _clean_list(
            result.get("recommendations"),
            5,
        )

        # ====================================================
        # CLEAN SUMMARY
        # ====================================================

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
        # VALIDATE AI OUTPUT
        # ====================================================

        if len(strengths) < 5:
            raise RuntimeError(
                f"Qwen returned only {len(strengths)} strengths. "
                "Exactly 5 are required."
            )

        if len(areas_to_improve) < 5:
            raise RuntimeError(
                f"Qwen returned only "
                f"{len(areas_to_improve)} areas_to_improve. "
                "Exactly 5 are required."
            )

        if len(recommendations) < 5:
            raise RuntimeError(
                f"Qwen returned only "
                f"{len(recommendations)} recommendations. "
                "Exactly 5 are required."
            )

        if not summary:
            raise RuntimeError(
                "Qwen returned no assessment_summary."
            )

        # ====================================================
        # SUCCESS RESPONSE
        # ====================================================

        return {
            "strengths": strengths,

            # Existing frontend/backend field
            "weaknesses": areas_to_improve,

            # Existing frontend/backend field
            "suggestions": recommendations,

            # Clear Task 16 recommendation field
            "recommendations": recommendations,

            "assessment_summary": summary,

            "llm_status": "success",

            "llm_error": "",
        }

    # ========================================================
    # LLM ERROR
    # ========================================================

    except Exception as exc:

        # IMPORTANT:
        # Do not modify the existing Round 2 scoring,
        # timing, interview flow, or other Task 16 data.
        #
        # If Ollama fails, return the same safe error structure
        # instead of crashing the existing feedback page.

        return {
            "strengths": [],

            "weaknesses": [],

            "suggestions": [],

            "recommendations": [],

            "assessment_summary": "",

            "llm_status": "error",

            "llm_error": str(exc),
        }