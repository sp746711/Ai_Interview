import json
import re
from typing import Any

import httpx


# ============================================================
# OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:4b"

# Background analysis can take some time on CPU.
# It does NOT block Round 1 because your controller uses create_task().
OLLAMA_TIMEOUT = 180.0


# ============================================================
# OLLAMA CONNECTION CHECK
# ============================================================

async def check_ollama_connection() -> dict:
    """
    Check whether Ollama is running and whether
    the configured Qwen model is available.
    """

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{OLLAMA_URL}/api/tags"
            )

            response.raise_for_status()

            data = response.json()

            models = data.get("models", [])

            available_models = [
                str(model.get("name", "")).strip()
                for model in models
                if isinstance(model, dict)
            ]

            model_available = any(
                name == OLLAMA_MODEL
                or name.startswith(f"{OLLAMA_MODEL}:")
                for name in available_models
            )

            return {
                "connected": True,
                "model": OLLAMA_MODEL,
                "model_available": model_available,
                "available_models": available_models,
            }

    except Exception as exc:

        return {
            "connected": False,
            "model": OLLAMA_MODEL,
            "model_available": False,
            "available_models": [],
            "error": str(exc),
        }


# ============================================================
# SMALL HELPERS
# ============================================================

def _safe_int(
    value: Any,
    default: int = 0,
) -> int:

    try:
        value = int(float(value))
    except (TypeError, ValueError):
        value = default

    return max(
        0,
        min(100, value),
    )


def _clean_text(
    value: Any,
) -> str:

    if value is None:
        return ""

    return str(value).strip()


def _clean_string_list(
    value: Any,
    limit: int | None = None,
) -> list[str]:

    if not isinstance(value, list):
        return []

    result = []

    for item in value:

        text = _clean_text(item)

        if not text:
            continue

        if text not in result:
            result.append(text)

        if (
            limit is not None
            and len(result) >= limit
        ):
            break

    return result


# ============================================================
# EXTRACT JSON SAFELY
# ============================================================

def _extract_json(
    raw_output: str,
) -> dict:

    if not raw_output:
        raise RuntimeError(
            "Ollama returned an empty resume analysis."
        )

    raw_output = raw_output.strip()

    # --------------------------------------------------------
    # First attempt: direct JSON
    # --------------------------------------------------------

    try:

        data = json.loads(raw_output)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Remove Markdown fences if Qwen ignored instructions
    # --------------------------------------------------------

    cleaned = raw_output

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned,
    )

    cleaned = cleaned.strip()

    try:

        data = json.loads(cleaned)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Final fallback:
    # extract first complete-looking JSON object
    # --------------------------------------------------------

    start = cleaned.find("{")
    end = cleaned.rfind("}")

    if (
        start != -1
        and end != -1
        and end > start
    ):

        possible_json = cleaned[
            start:end + 1
        ]

        try:

            data = json.loads(
                possible_json
            )

            if isinstance(data, dict):
                return data

        except json.JSONDecodeError:
            pass

    raise RuntimeError(
        "Ollama did not return valid JSON."
    )


# ============================================================
# NORMALIZE BEST-FIT ROLES
# ============================================================

def _normalize_best_fit_roles(
    value: Any,
) -> list[dict]:

    if not isinstance(value, list):
        return []

    result = []

    for item in value[:5]:

        if not isinstance(item, dict):
            continue

        role = _clean_text(
            item.get("role")
        )

        reason = _clean_text(
            item.get("reason")
        )

        percentage = _safe_int(
            item.get(
                "match_percentage",
                0,
            )
        )

        if not role:
            continue

        result.append(
            {
                "role": role,
                "match_percentage": percentage,
                "reason": reason,
            }
        )

    return result


# ============================================================
# NORMALIZE MATCHING SKILLS
# ============================================================

def _normalize_matching_skills(
    value: Any,
) -> list[dict]:

    if not isinstance(value, list):
        return []

    result = []

    for item in value[:15]:

        if isinstance(item, str):

            skill = item.strip()

            if skill:

                result.append(
                    {
                        "skill": skill,
                        "evidence": (
                            "Skill detected in the resume."
                        ),
                    }
                )

            continue

        if not isinstance(item, dict):
            continue

        skill = _clean_text(
            item.get("skill")
        )

        evidence = _clean_text(
            item.get("evidence")
        )

        if not skill:
            continue

        result.append(
            {
                "skill": skill,
                "evidence": evidence,
            }
        )

    return result


# ============================================================
# NORMALIZE WEAK EVIDENCE
# ============================================================

def _normalize_weak_evidence(
    value: Any,
) -> list[dict]:

    if not isinstance(value, list):
        return []

    result = []

    for item in value[:10]:

        if isinstance(item, str):

            text = item.strip()

            if text:

                result.append(
                    {
                        "area": text,
                        "reason": (
                            "This area needs stronger "
                            "evidence in the resume."
                        ),
                    }
                )

            continue

        if not isinstance(item, dict):
            continue

        area = _clean_text(
            item.get("area")
        )

        reason = _clean_text(
            item.get("reason")
        )

        if not area:
            continue

        result.append(
            {
                "area": area,
                "reason": reason,
            }
        )

    return result


# ============================================================
# MAIN RESUME AI ANALYSIS
# ============================================================

async def analyze_resume_with_llm(
    resume_text: str,
    selected_domain: str,
    detected_skills: list | None = None,
) -> dict:
    """
    Analyze the actual resume using local Qwen through Ollama.

    IMPORTANT:

    - ATS score is NOT calculated here.
    - Existing Python resume analyzer handles ATS.
    - This function performs semantic resume analysis only.

    Returns:

    selected_domain
    domain_match_percentage
    best_fit_roles
    matching_skills
    missing_or_weak_evidence
    personalized_improvements
    resume_summary
    """

    # ========================================================
    # VALIDATION
    # ========================================================

    resume_text = _clean_text(
        resume_text
    )

    selected_domain = _clean_text(
        selected_domain
    )

    if not resume_text:

        raise ValueError(
            "Resume text is required."
        )

    if not selected_domain:

        raise ValueError(
            "Selected domain is required."
        )

    if not isinstance(
        detected_skills,
        list,
    ):
        detected_skills = []

    detected_skills = [
        _clean_text(skill)
        for skill in detected_skills
        if _clean_text(skill)
    ]

    # ========================================================
    # LIMIT EXTREMELY LARGE RESUME TEXT
    # ========================================================
    #
    # A normal resume does not need unlimited text.
    # This prevents Ollama from receiving unnecessary
    # huge input and becoming very slow.
    # ========================================================

    MAX_RESUME_CHARS = 18000

    if len(resume_text) > MAX_RESUME_CHARS:

        resume_text = resume_text[
            :MAX_RESUME_CHARS
        ]

    # ========================================================
    # PROMPT
    # ========================================================

    prompt = f"""
You are a professional resume evaluator inside an AI mock interview platform.

Analyze ONLY the resume supplied below.

TARGET ROLE OR DOMAIN:
{selected_domain}

IMPORTANT RULES:

1. Use only evidence actually present in the resume.

2. Never invent:
   - skills
   - projects
   - experience
   - certifications
   - education
   - achievements
   - tools
   - job history

3. Analyze the candidate semantically.

4. Evaluate how strongly the resume supports the selected target:
   "{selected_domain}"

5. Recommend 3 to 5 realistic best-fit job roles based on the resume.

6. For each best-fit role:
   - provide role name
   - match percentage
   - short evidence-based reason

7. Identify matching skills and explain the resume evidence.

8. Identify important missing or weak evidence for the selected target.

9. Give personalized resume improvements.

10. Give a concise professional resume summary.

11. Percentages must be integers from 0 to 100.

12. Do NOT calculate ATS score.

13. Return JSON only.

14. Do not use Markdown.

15. Do not put the response inside ```.

16. Do not add commentary before or after the JSON.

EXISTING PYTHON-DETECTED SKILLS:

{json.dumps(
    detected_skills,
    ensure_ascii=False
)}

ACTUAL RESUME:

----- RESUME START -----

{resume_text}

----- RESUME END -----

Return EXACTLY this structure:

{{
  "selected_domain": "{selected_domain}",
  "domain_match_percentage": 0,

  "best_fit_roles": [
    {{
      "role": "Job role",
      "match_percentage": 0,
      "reason": "Evidence-based explanation"
    }}
  ],

  "matching_skills": [
    {{
      "skill": "Skill",
      "evidence": "Specific resume evidence"
    }}
  ],

  "missing_or_weak_evidence": [
    {{
      "area": "Area",
      "reason": "Why evidence is missing or weak"
    }}
  ],

  "personalized_improvements": [
    "Improvement 1",
    "Improvement 2",
    "Improvement 3"
  ],

  "resume_summary":
    "Professional semantic assessment of this resume."
}}
""".strip()

    # ========================================================
    # OLLAMA REQUEST
    # ========================================================

    payload = {
        "model": OLLAMA_MODEL,

        "prompt": prompt,

        "stream": False,

        "format": "json",

        # Keep model loaded so another request does not
        # immediately require another cold model load.
        "keep_alive": "10m",

        "options": {
            "temperature": 0.1,

            # Enough output for detailed JSON without
            # letting the model generate endlessly.
            "num_predict": 1800,

            # Suitable context for normal resumes.
            "num_ctx": 8192,
        },
    }

    # ========================================================
    # SEND REQUEST
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

            ollama_response = (
                response.json()
            )

    except httpx.ConnectError as exc:

        raise RuntimeError(
            "Could not connect to Ollama. "
            "Make sure Ollama is running on "
            "http://localhost:11434."
        ) from exc

    except httpx.TimeoutException as exc:

        raise RuntimeError(
            "Ollama took too long to analyze "
            "the resume."
        ) from exc

    except httpx.HTTPStatusError as exc:

        status = (
            exc.response.status_code
            if exc.response
            else "unknown"
        )

        raise RuntimeError(
            f"Ollama returned HTTP error: "
            f"{status}"
        ) from exc

    except Exception as exc:

        raise RuntimeError(
            "Failed to communicate with Ollama: "
            f"{str(exc)}"
        ) from exc

    # ========================================================
    # GET MODEL RESPONSE
    # ========================================================

    raw_output = _clean_text(
        ollama_response.get(
            "response",
            "",
        )
    )

    if not raw_output:

        raise RuntimeError(
            "Ollama returned an empty "
            "resume analysis."
        )

    # ========================================================
    # PARSE JSON
    # ========================================================

    analysis = _extract_json(
        raw_output
    )

    # ========================================================
    # NORMALIZE SELECTED DOMAIN
    # ========================================================

    analysis["selected_domain"] = (
        selected_domain
    )

    # ========================================================
    # DOMAIN MATCH
    # ========================================================

    analysis[
        "domain_match_percentage"
    ] = _safe_int(
        analysis.get(
            "domain_match_percentage",
            0,
        )
    )

    # ========================================================
    # BEST-FIT JOB ROLES
    # ========================================================

    analysis["best_fit_roles"] = (
        _normalize_best_fit_roles(
            analysis.get(
                "best_fit_roles",
                [],
            )
        )
    )

    # ========================================================
    # MATCHING SKILLS
    # ========================================================

    analysis["matching_skills"] = (
        _normalize_matching_skills(
            analysis.get(
                "matching_skills",
                [],
            )
        )
    )

    # ========================================================
    # MISSING / WEAK EVIDENCE
    # ========================================================

    analysis[
        "missing_or_weak_evidence"
    ] = _normalize_weak_evidence(
        analysis.get(
            "missing_or_weak_evidence",
            [],
        )
    )

    # ========================================================
    # PERSONALIZED IMPROVEMENTS
    # ========================================================

    analysis[
        "personalized_improvements"
    ] = _clean_string_list(
        analysis.get(
            "personalized_improvements",
            [],
        ),
        limit=10,
    )

    # ========================================================
    # RESUME SUMMARY
    # ========================================================

    analysis["resume_summary"] = (
        _clean_text(
            analysis.get(
                "resume_summary",
                "",
            )
        )
    )

    # ========================================================
    # FINAL VALIDATED RESULT
    # ========================================================

    final_analysis = {
        "selected_domain":
            analysis["selected_domain"],

        "domain_match_percentage":
            analysis[
                "domain_match_percentage"
            ],

        "best_fit_roles":
            analysis["best_fit_roles"],

        "matching_skills":
            analysis["matching_skills"],

        "missing_or_weak_evidence":
            analysis[
                "missing_or_weak_evidence"
            ],

        "personalized_improvements":
            analysis[
                "personalized_improvements"
            ],

        "resume_summary":
            analysis["resume_summary"],
    }

    return final_analysis