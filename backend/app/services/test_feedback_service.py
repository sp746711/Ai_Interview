import json
import re
from typing import Any

import httpx


# ============================================================
# TASK 16 — OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:4b"

# Increased enough for slower local Qwen generation,
# while keeping the request bounded.
OLLAMA_TIMEOUT = 240.0


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
        raise ValueError(
            "Qwen output is not a string."
        )

    text = raw_output.strip()

    if not text:
        raise ValueError(
            "Qwen returned an empty response."
        )

    # Remove opening markdown code fence.
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # Remove closing markdown code fence.
    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

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
    # JSON embedded inside additional text
    # --------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:

        candidate = text[
            start:end + 1
        ]

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
    Normalize an AI-generated list.

    Task 16 requires UP TO 5 items.
    It does NOT require exactly 5.
    """

    if isinstance(value, str):
        value = [value]

    if not isinstance(value, list):
        return []

    cleaned: list[str] = []
    seen: set[str] = set()

    for item in value:

        if item is None:
            continue

        item = str(item).strip()

        if not item:
            continue

        # Remove duplicate items.
        normalized = re.sub(
            r"\s+",
            " ",
            item,
        ).casefold()

        if normalized in seen:
            continue

        seen.add(normalized)
        cleaned.append(item)

        if len(cleaned) >= limit:
            break

    return cleaned


def _safe_int(
    value: Any,
    default: int = 0,
) -> int:
    """
    Safely convert a value to integer.
    """

    try:
        return int(
            float(value)
        )

    except (
        TypeError,
        ValueError,
    ):
        return default


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Safely convert a value to float.
    """

    try:
        return float(value)

    except (
        TypeError,
        ValueError,
    ):
        return default


def _normalize_category_scores(
    category_scores: Any,
) -> dict:
    """
    Keep only useful category performance information.

    This reduces the amount of data sent to Qwen while
    preserving the candidate's real Round 2 performance.
    """

    if not isinstance(
        category_scores,
        dict,
    ):
        return {}

    normalized: dict = {}

    for raw_name, raw_data in category_scores.items():

        if not isinstance(
            raw_data,
            dict,
        ):
            continue

        name = str(
            raw_name
        ).strip()

        if not name:
            continue

        total = _safe_int(
            raw_data.get(
                "total",
                0,
            )
        )

        correct = _safe_int(
            raw_data.get(
                "correct",
                0,
            )
        )

        incorrect = _safe_int(
            raw_data.get(
                "incorrect",
                0,
            )
        )

        skipped = _safe_int(
            raw_data.get(
                "skipped",
                0,
            )
        )

        percentage_value = raw_data.get(
            "percentage",
            None,
        )

        if percentage_value is None:

            if total > 0:

                percentage = round(
                    (
                        correct
                        / total
                    ) * 100,
                    1,
                )

            else:

                percentage = 0.0

        else:

            percentage = _safe_float(
                percentage_value,
                0.0,
            )

        normalized[name] = {
            "total": total,
            "correct": correct,
            "incorrect": incorrect,
            "skipped": skipped,
            "percentage": percentage,
        }

    return normalized


def _category_rankings(
    category_scores: dict,
) -> tuple[list[dict], list[dict]]:
    """
    Return categories ranked strongest-to-weakest
    and weakest-to-strongest.
    """

    rows: list[dict] = []

    for name, data in category_scores.items():

        if not isinstance(
            data,
            dict,
        ):
            continue

        total = _safe_int(
            data.get(
                "total",
                0,
            )
        )

        if total <= 0:
            continue

        percentage = _safe_float(
            data.get(
                "percentage",
                0,
            )
        )

        rows.append(
            {
                "name": name,
                "total": total,
                "correct": _safe_int(
                    data.get(
                        "correct",
                        0,
                    )
                ),
                "incorrect": _safe_int(
                    data.get(
                        "incorrect",
                        0,
                    )
                ),
                "skipped": _safe_int(
                    data.get(
                        "skipped",
                        0,
                    )
                ),
                "percentage": percentage,
            }
        )

    strongest = sorted(
        rows,
        key=lambda row: row[
            "percentage"
        ],
        reverse=True,
    )

    weakest = sorted(
        rows,
        key=lambda row: row[
            "percentage"
        ],
    )

    return (
        strongest,
        weakest,
    )


# ============================================================
# TASK 16 — REAL ROUND 2 FALLBACK
# ============================================================

def _fallback_feedback(
    *,
    total_questions: int,
    correct: int,
    incorrect: int,
    skipped: int,
    test_score: float,
    average_time: float,
    fastest_time: float,
    slowest_time: float,
    time_efficiency: float,
    category_scores: dict,
) -> dict:
    """
    Generate personalized Task 16 feedback using ONLY
    the candidate's actual Round 2 performance.

    This is used when Qwen:
    - times out
    - is unavailable
    - returns invalid JSON
    - returns unusable data
    """

    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendations: list[str] = []

    strongest, weakest = _category_rankings(
        category_scores
    )

    # ========================================================
    # STRENGTHS
    # ========================================================

    # Strong category performance.
    for row in strongest:

        if len(strengths) >= 3:
            break

        if row["percentage"] >= 60:

            strengths.append(
                f"Your {row['name']} performance was "
                f"a relative strength, with "
                f"{row['correct']} correct out of "
                f"{row['total']} questions "
                f"({row['percentage']:.1f}% accuracy)."
            )

    # If no category reaches 60%, identify the relative
    # strongest category from the actual result.
    if not strengths and strongest:

        best = strongest[0]

        strengths.append(
            f"Among the assessed categories, "
            f"{best['name']} was your strongest area "
            f"at {best['percentage']:.1f}% accuracy, "
            f"with {best['correct']} correct out of "
            f"{best['total']} questions."
        )

    # Overall accuracy strength.
    if (
        total_questions > 0
        and len(strengths) < 5
    ):

        accuracy = (
            correct
            / total_questions
        ) * 100

        if accuracy >= 70:

            strengths.append(
                f"You answered {correct} of "
                f"{total_questions} questions correctly, "
                f"giving an overall accuracy of "
                f"{accuracy:.1f}%."
            )

    # No skipped questions.
    if (
        total_questions > 0
        and skipped == 0
        and len(strengths) < 5
    ):

        strengths.append(
            f"You attempted all {total_questions} "
            f"Round 2 questions without skipping any."
        )

    # Time efficiency.
    if (
        average_time > 0
        and time_efficiency >= 70
        and len(strengths) < 5
    ):

        strengths.append(
            f"Your recorded time efficiency was "
            f"{time_efficiency:.1f}%, indicating "
            f"relatively effective response pacing."
        )

    # ========================================================
    # AREAS TO IMPROVE
    # ========================================================

    for row in weakest:

        if len(weaknesses) >= 3:
            break

        if row["percentage"] < 60:

            weaknesses.append(
                f"{row['name']} needs improvement because "
                f"you answered {row['correct']} of "
                f"{row['total']} correctly "
                f"({row['percentage']:.1f}% accuracy)."
            )

    # Skipped questions.
    if skipped > 0:

        weaknesses.append(
            f"You skipped {skipped} of "
            f"{total_questions} questions, reducing "
            f"the number of questions completed in "
            f"the assessment."
        )

    # Incorrect answers.
    if (
        incorrect > 0
        and len(weaknesses) < 5
    ):

        weaknesses.append(
            f"You had {incorrect} incorrect answers, "
            f"showing that some assessed concepts "
            f"need stronger accuracy."
        )

    # Slow responses.
    if (
        average_time > 0
        and slowest_time > 0
        and slowest_time > (
            average_time * 2
        )
        and len(weaknesses) < 5
    ):

        weaknesses.append(
            f"Your slowest recorded response was "
            f"{slowest_time:.1f} seconds compared "
            f"with an average of "
            f"{average_time:.1f} seconds, so some "
            f"questions required substantially more "
            f"time than your typical response."
        )

    # ========================================================
    # RECOMMENDATIONS
    # ========================================================

    # Weakest categories.
    for row in weakest:

        if len(recommendations) >= 3:
            break

        if row["percentage"] < 60:

            recommendations.append(
                f"Prioritize {row['name']} practice and "
                f"review the concepts behind your "
                f"incorrect answers in that category."
            )

    # Skipped questions.
    if (
        skipped > 0
        and len(recommendations) < 5
    ):

        recommendations.append(
            f"Practice timed assessment sets to reduce "
            f"the {skipped} skipped questions while "
            f"maintaining answer accuracy."
        )

    # Incorrect answers.
    if (
        incorrect > 0
        and len(recommendations) < 5
    ):

        recommendations.append(
            f"Review the {incorrect} incorrect responses "
            f"and identify the concepts or question "
            f"patterns that caused those mistakes."
        )

    # Time.
    if (
        average_time > 0
        and slowest_time > 0
        and slowest_time > (
            average_time * 2
        )
        and len(recommendations) < 5
    ):

        recommendations.append(
            "Use timed practice to improve decision "
            "speed on questions that currently take "
            "substantially longer than your average."
        )

    # Generic-but-still-performance-based fallback
    # only if there is no other recommendation.
    if (
        not recommendations
        and total_questions > 0
    ):

        recommendations.append(
            f"Continue practicing Round 2-style "
            f"questions while tracking your "
            f"{correct} correct responses and "
            f"overall score of {test_score:.1f}."
        )

    # ========================================================
    # GUARANTEE USEFUL DATA
    # ========================================================

    if (
        not strengths
        and total_questions > 0
    ):

        strengths.append(
            f"You completed a Round 2 assessment "
            f"containing {total_questions} questions "
            f"with a recorded score of "
            f"{test_score:.1f}."
        )

    if (
        not weaknesses
        and total_questions > 0
    ):

        weaknesses.append(
            f"Your Round 2 result contained "
            f"{correct} correct, "
            f"{incorrect} incorrect, and "
            f"{skipped} skipped answers out of "
            f"{total_questions} questions."
        )

    # ========================================================
    # LIMIT TO FIVE
    # ========================================================

    strengths = _clean_list(
        strengths,
        5,
    )

    weaknesses = _clean_list(
        weaknesses,
        5,
    )

    recommendations = _clean_list(
        recommendations,
        5,
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    if total_questions > 0:

        accuracy = (
            correct
            / total_questions
        ) * 100

        summary = (
            f"Your Round 2 performance was based on "
            f"{total_questions} questions: "
            f"{correct} correct, "
            f"{incorrect} incorrect, and "
            f"{skipped} skipped. Your recorded "
            f"score was {test_score:.1f}, with "
            f"overall answer accuracy of "
            f"{accuracy:.1f}%."
        )

        if strongest:

            best = strongest[0]

            summary += (
                f" Your strongest assessed category "
                f"was {best['name']} at "
                f"{best['percentage']:.1f}% accuracy."
            )

        if weakest:

            worst = weakest[0]

            if (
                not strongest
                or worst["name"]
                != strongest[0]["name"]
            ):

                summary += (
                    f" Your weakest assessed category "
                    f"was {worst['name']} at "
                    f"{worst['percentage']:.1f}% accuracy."
                )

    else:

        summary = (
            "There was insufficient Round 2 performance "
            "data to generate a detailed personalized "
            "assessment summary."
        )

    return {
        "strengths": strengths,
        "weaknesses": weaknesses,
        "suggestions": recommendations,
        "recommendations": recommendations,
        "assessment_summary": summary,
    }


# ============================================================
# TASK 16 — MAIN FUNCTION
# ============================================================

async def generate_test_feedback(
    round2_result: dict,
    interview_type: str = "technical",
) -> dict:
    """
    TASK 16 ONLY.

    Generate personalized feedback from the candidate's
    actual saved Round 2 performance.

    IMPORTANT:
    - Does not modify Round 2 scoring.
    - Does not use Round 1.
    - Does not use Round 3.
    - Does not use resume information.
    - Does not use ATS information.
    - Uses Qwen3:4b when available.
    - Uses real Round 2 fallback when Qwen fails.
    """

    # ========================================================
    # SAFETY CHECK
    # ========================================================

    if not isinstance(
        round2_result,
        dict,
    ):

        round2_result = {}

    # ========================================================
    # ROUND 2 PERFORMANCE
    # ========================================================

    category_scores = _normalize_category_scores(
        round2_result.get(
            "category_scores",
            {},
        )
    )

    # We intentionally DO NOT send all question_results
    # to Qwen. The aggregate performance data is enough
    # for Task 16 and keeps the local model request small.
    question_results = round2_result.get(
        "question_results",
        [],
    )

    if not isinstance(
        question_results,
        list,
    ):

        question_results = []

    total_questions = _safe_int(
        round2_result.get(
            "total_questions",
            0,
        )
    )

    correct = _safe_int(
        round2_result.get(
            "correct_answers",
            round2_result.get(
                "correct",
                0,
            ),
        )
    )

    incorrect = _safe_int(
        round2_result.get(
            "incorrect_answers",
            round2_result.get(
                "incorrect",
                0,
            ),
        )
    )

    skipped = _safe_int(
        round2_result.get(
            "skipped_answers",
            round2_result.get(
                "skipped",
                0,
            ),
        )
    )

    test_score = _safe_float(
        round2_result.get(
            "score",
            round2_result.get(
                "test_score",
                round2_result.get(
                    "percentage",
                    0,
                ),
            ),
        )
    )

    # ========================================================
    # TIME DATA
    # ========================================================

    average_time = _safe_float(
        round2_result.get(
            "average_time_seconds",
            round2_result.get(
                "average_time",
                round2_result.get(
                    "average_time_per_question",
                    0,
                ),
            ),
        )
    )

    fastest_time = _safe_float(
        round2_result.get(
            "fastest_time",
            round2_result.get(
                "fastest_average_time",
                0,
            ),
        )
    )

    slowest_time = _safe_float(
        round2_result.get(
            "slowest_time",
            round2_result.get(
                "slowest_average_time",
                0,
            ),
        )
    )

    time_efficiency = _safe_float(
        round2_result.get(
            "time_efficiency",
            0,
        )
    )

    # ========================================================
    # DEBUG LOG
    # ========================================================

    print(
        "\n========== TASK 16 REAL ROUND 2 DATA =========="
    )

    print(
        "Total:",
        total_questions,
    )

    print(
        "Correct:",
        correct,
    )

    print(
        "Incorrect:",
        incorrect,
    )

    print(
        "Skipped:",
        skipped,
    )

    print(
        "Score:",
        test_score,
    )

    print(
        "Average Time:",
        average_time,
    )

    print(
        "Fastest Time:",
        fastest_time,
    )

    print(
        "Slowest Time:",
        slowest_time,
    )

    print(
        "Time Efficiency:",
        time_efficiency,
    )

    print(
        "Categories:",
        category_scores,
    )

    print(
        "Question Results Available:",
        len(question_results),
    )

    print(
        "===============================================\n"
    )

    # ========================================================
    # CREATE FALLBACK BEFORE CALLING QWEN
    # ========================================================

    fallback = _fallback_feedback(
        total_questions=total_questions,
        correct=correct,
        incorrect=incorrect,
        skipped=skipped,
        test_score=test_score,
        average_time=average_time,
        fastest_time=fastest_time,
        slowest_time=slowest_time,
        time_efficiency=time_efficiency,
        category_scores=category_scores,
    )

    # ========================================================
    # VERIFY THAT WE HAVE ROUND 2 DATA
    # ========================================================

    if (
        total_questions <= 0
        and not category_scores
        and not question_results
    ):

        print(
            "TASK 16: NO USABLE ROUND 2 DATA"
        )

        return {
            **fallback,
            "llm_status": "error",
            "llm_error": (
                "No usable Round 2 performance data "
                "was available."
            ),
        }

    # ========================================================
    # SMALL QWEN INPUT
    # ========================================================
    #
    # IMPORTANT:
    #
    # Previous version sent all 50 question results.
    # That made the local Qwen request unnecessarily large.
    #
    # Now Qwen receives the actual aggregate performance:
    #
    # score
    # correct
    # incorrect
    # skipped
    # category scores
    # timing
    #
    # This still gives Qwen the candidate's real performance
    # while significantly reducing processing time.
    # ========================================================

    qwen_performance = {
        "total_questions": total_questions,
        "correct_answers": correct,
        "incorrect_answers": incorrect,
        "skipped_answers": skipped,
        "score": test_score,
        "average_time_seconds": average_time,
        "fastest_time_seconds": fastest_time,
        "slowest_time_seconds": slowest_time,
        "time_efficiency_percent": time_efficiency,
        "category_scores": category_scores,
    }

    # ========================================================
    # QWEN PROMPT
    # ========================================================

    prompt = f"""
You are the Task 16 AI feedback engine for a mock interview platform.

Analyze ONLY this candidate's REAL Round 2 performance.

Interview type:
{str(interview_type).strip() or "technical"}

Round 2 performance:
{json.dumps(
    qwen_performance,
    ensure_ascii=False,
)}

IMPORTANT:
The numbers above are the source of truth.

Generate personalized feedback for THIS candidate.

Do not give generic feedback.
Every statement must be supported by the supplied Round 2 data.

Rules:

1. Use only Round 2 performance data.

2. Do not invent scores, percentages, categories, timing,
   question results, skills, abilities, emotions, confidence,
   personality traits, or other measurements.

3. Do not use Round 1.

4. Do not use Round 3.

5. Do not use resume information.

6. Do not use ATS information.

7. Do not calculate ATS.

8. Strengths must describe areas where this candidate
   performed relatively well.

9. Areas to improve must come from actual weaknesses
   visible in the supplied performance.

10. Skipped questions should be mentioned when they
    materially affect the result.

11. Category feedback must use the supplied category scores.

12. Timing feedback must use only supplied timing values.

13. Recommendations must directly address the candidate's
    actual weaknesses.

14. Do not invent extra weaknesses or strengths just to
    make the response longer.

15. Return UP TO 5 strengths.

16. Return UP TO 5 areas_to_improve.

17. Return UP TO 5 recommendations.

18. Five is the maximum, NOT a requirement.

19. Every item must be a complete meaningful sentence.

20. assessment_summary must summarize this candidate's
    actual Round 2 performance.

Return ONLY valid JSON.

Required structure:

{{
  "strengths": [
    "Personalized strength based on the supplied performance."
  ],
  "areas_to_improve": [
    "Personalized improvement area based on the supplied performance."
  ],
  "recommendations": [
    "Specific recommendation based on the supplied performance."
  ],
  "assessment_summary": "Personalized summary based only on Round 2 performance."
}}
""".strip()

    # ========================================================
    # OLLAMA REQUEST
    # ========================================================

    payload = {
        "model": OLLAMA_MODEL,

        "prompt": prompt,

        "stream": False,

        # Ask Ollama for JSON.
        "format": "json",

        # Qwen3 does not need visible reasoning for this task.
        "think": False,

        # Keep the model loaded for later Task 16 requests.
        "keep_alive": "10m",

        "options": {
            # Low temperature keeps feedback factual.
            "temperature": 0.2,

            # Task 16 does not need a huge response.
            "num_predict": 1000,

            # Prompt is now much smaller.
            "num_ctx": 4096,
        },
    }

    # ========================================================
    # CALL QWEN
    # ========================================================

    try:

        timeout = httpx.Timeout(
            connect=10.0,
            read=OLLAMA_TIMEOUT,
            write=30.0,
            pool=10.0,
        )

        print(
            "TASK 16: calling Ollama "
            f"{OLLAMA_URL}/api/generate"
        )

        print(
            "TASK 16: model:",
            OLLAMA_MODEL,
        )

        print(
            "TASK 16: compact prompt size:",
            len(prompt),
            "characters",
        )

        async with httpx.AsyncClient(
            timeout=timeout,
        ) as client:

            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json=payload,
            )

        print(
            "TASK 16: Ollama HTTP status:",
            response.status_code,
        )

        response.raise_for_status()

        # ====================================================
        # PARSE OLLAMA RESPONSE
        # ====================================================

        try:

            ollama_data = response.json()

        except ValueError as exc:

            raise RuntimeError(
                "Ollama returned a non-JSON HTTP response."
            ) from exc

        if not isinstance(
            ollama_data,
            dict,
        ):

            raise RuntimeError(
                "Ollama response was not a JSON object."
            )

        # ====================================================
        # GET NORMAL RESPONSE
        # ====================================================

        raw_output = str(
            ollama_data.get(
                "response",
                "",
            )
            or ""
        ).strip()

        # ====================================================
        # THINKING FALLBACK
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
                    default=str,
                )

            else:

                raw_output = str(
                    thinking_output or ""
                ).strip()

        if not raw_output:

            raise RuntimeError(
                "Qwen returned no usable feedback."
            )

        print(
            "TASK 16: Qwen response received:",
            len(raw_output),
            "characters",
        )

        # ====================================================
        # EXTRACT JSON
        # ====================================================

        result = _extract_json(
            raw_output
        )

        # ====================================================
        # NORMALIZE QWEN OUTPUT
        # ========================================================

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

            summary = str(
                summary
            )

        summary = summary.strip()

        # ====================================================
        # PARTIAL RESPONSE HANDLING
        # ====================================================
        #
        # IMPORTANT:
        #
        # We do NOT reject Qwen just because it returned
        # fewer than five items.
        #
        # Empty individual sections use the deterministic
        # fallback based on the same Round 2 data.
        # ========================================================

        if not strengths:

            strengths = fallback[
                "strengths"
            ]

        if not areas_to_improve:

            areas_to_improve = fallback[
                "weaknesses"
            ]

        if not recommendations:

            recommendations = fallback[
                "recommendations"
            ]

        if not summary:

            summary = fallback[
                "assessment_summary"
            ]

        # Final safety limit.
        strengths = _clean_list(
            strengths,
            5,
        )

        areas_to_improve = _clean_list(
            areas_to_improve,
            5,
        )

        recommendations = _clean_list(
            recommendations,
            5,
        )

        # ====================================================
        # FINAL VALIDATION
        # ====================================================

        if not summary:

            raise RuntimeError(
                "No usable Task 16 assessment summary "
                "was available."
            )

        # At least one useful section should exist.
        if (
            not strengths
            and not areas_to_improve
            and not recommendations
        ):

            raise RuntimeError(
                "Qwen returned no usable Task 16 feedback."
            )

        # ====================================================
        # SUCCESS
        # ====================================================

        print(
            "TASK 16 QWEN STATUS: SUCCESS"
        )

        print(
            "TASK 16 QWEN ITEMS:",
            f"strengths={len(strengths)},",
            f"weaknesses={len(areas_to_improve)},",
            f"recommendations={len(recommendations)}",
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
    # QWEN ERROR → REAL ROUND 2 FALLBACK
    # ========================================================

    except Exception as exc:

        error_message = (
            f"{type(exc).__name__}: {exc}"
        )

        print(
            "TASK 16 QWEN ERROR:",
            error_message,
        )

        print(
            "TASK 16: USING REAL ROUND 2 "
            "FALLBACK FEEDBACK"
        )

        return {
            "strengths": fallback[
                "strengths"
            ],

            "weaknesses": fallback[
                "weaknesses"
            ],

            "suggestions": fallback[
                "suggestions"
            ],

            "recommendations": fallback[
                "recommendations"
            ],

            "assessment_summary": fallback[
                "assessment_summary"
            ],

            "llm_status": "error",

            "llm_error": error_message,
        }