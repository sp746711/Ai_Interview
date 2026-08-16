import json
import re
from typing import Any

import httpx


# ============================================================
# OLLAMA CONFIGURATION
# ============================================================

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen3:4b"

# Qwen may take some time on CPU for a full resume.
OLLAMA_TIMEOUT = 600.0


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
    """
    Convert a value to an integer percentage
    and clamp it between 0 and 100.
    """

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
    """
    Convert any value to clean text.
    """

    if value is None:
        return ""

    return str(value).strip()


def _clean_string_list(
    value: Any,
    limit: int | None = None,
) -> list[str]:
    """
    Normalize a list of strings.
    """

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
    """
    Extract valid JSON from Qwen output.

    Supports:
    - normal JSON
    - JSON inside markdown fences
    - JSON surrounded by additional text
    """

    if not raw_output:
        raise RuntimeError(
            "Ollama returned an empty resume analysis."
        )

    raw_output = raw_output.strip()

    # --------------------------------------------------------
    # 1. Direct JSON
    # --------------------------------------------------------

    try:
        data = json.loads(raw_output)

        if isinstance(data, dict):
            return data

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # 2. Remove markdown fences
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
    # 3. Extract JSON object from surrounding text
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
    """
    Normalize Qwen best-fit job-role recommendations.
    """

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
    """
    Normalize matching skills returned by Qwen.
    """

    if not isinstance(value, list):
        return []

    result = []

    for item in value[:15]:

        # ----------------------------------------------------
        # Qwen returned simple string
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Expected dictionary format
        # ----------------------------------------------------

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
    """
    Normalize missing/weak resume evidence.
    """

    if not isinstance(value, list):
        return []

    result = []

    for item in value[:10]:

        # ----------------------------------------------------
        # Simple string fallback
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # Expected dictionary
        # ----------------------------------------------------

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
# FALLBACK DOMAIN MATCH
# ============================================================

def _fallback_domain_match(
    selected_domain: str,
    resume_text: str,
    detected_skills: list[str],
    analysis: dict,
) -> int:
    """
    Produce a conservative dynamic fallback when Qwen returns 0 or an
    unusable domain score. This is NOT an ATS score. It combines evidence
    from the selected domain, detected skills, resume text, best-fit roles,
    and missing evidence so the UI never receives a misleading hard-coded 0.
    """
    domain = _clean_text(selected_domain).lower()
    resume = _clean_text(resume_text).lower()
    skills = [s.lower() for s in detected_skills if _clean_text(s)]

    # Domain-specific evidence vocabulary. Keep this intentionally compact
    # and evidence-based; Qwen remains the primary evaluator.
    domain_groups = {
        "backend development": [
            "python", "fastapi", "flask", "django", "node", "node.js",
            "express", "rest api", "api", "mongodb", "postgresql",
            "mysql", "microservice", "docker", "redis", "server"
        ],
        "data analytics": [
            "python", "sql", "pandas", "numpy", "excel", "power bi",
            "tableau", "data analysis", "eda", "statistics",
            "visualization", "dashboard"
        ],
        "data analyst": [
            "python", "sql", "pandas", "numpy", "excel", "power bi",
            "tableau", "data analysis", "eda", "statistics",
            "visualization", "dashboard"
        ],
        "machine learning": [
            "python", "scikit-learn", "tensorflow", "keras", "pytorch",
            "machine learning", "deep learning", "model", "classification",
            "regression", "xgboost", "nlp"
        ],
        "machine learning engineer": [
            "python", "scikit-learn", "tensorflow", "keras", "pytorch",
            "machine learning", "deep learning", "model", "docker",
            "api", "deployment", "mlops"
        ],
        "software engineering": [
            "python", "java", "c", "javascript", "typescript", "git",
            "api", "database", "testing", "docker", "backend",
            "frontend", "software development"
        ],
        "software engineer": [
            "python", "java", "c", "javascript", "typescript", "git",
            "api", "database", "testing", "docker", "backend",
            "frontend", "software development"
        ],
        "ai/ml": [
            "python", "machine learning", "deep learning", "tensorflow",
            "pytorch", "scikit-learn", "nlp", "computer vision", "llm",
            "generative ai", "artificial intelligence"
        ],
        "generative ai": [
            "python", "llm", "large language model", "generative ai",
            "ollama", "openai", "transformer", "rag", "prompt", "nlp",
            "langchain", "hugging face"
        ],
        "llm engineering": [
            "python", "llm", "large language model", "generative ai",
            "ollama", "rag", "prompt", "langchain", "transformer",
            "hugging face", "api"
        ],
    }

    tokens = domain_groups.get(domain)
    if tokens is None:
        tokens = [
            token.strip(" ,/-")
            for token in re.split(r"\s+", domain)
            if len(token.strip(" ,/-")) >= 3
        ]

    if not tokens:
        return 0

    evidence = 0
    for token in tokens:
        if token in skills:
            evidence += 2
        elif token in resume:
            evidence += 1

    max_evidence = max(len(tokens) * 2, 1)
    score = round((evidence / max_evidence) * 100)

    # Best-fit role evidence is a useful secondary signal, but never lets
    # the fallback become artificially high.
    roles = analysis.get("best_fit_roles", [])
    if isinstance(roles, list):
        for item in roles[:3]:
            if not isinstance(item, dict):
                continue
            role = _clean_text(item.get("role")).lower()
            pct = _safe_int(item.get("match_percentage"), 0)
            if role and any(part in role or role in part for part in domain.split() if len(part) >= 4):
                score = max(score, min(pct, 85))
                break

    return max(0, min(100, score))


# ============================================================
# MAIN RESUME AI ANALYSIS
# ============================================================

async def analyze_resume_with_llm(
    resume_text: str,
    selected_domain: str,
    detected_skills: list | None = None,
) -> dict:
    """
    Analyze the actual resume using local Qwen3 through Ollama.

    IMPORTANT:

    ATS score is NOT calculated here.

    The existing Python resume analyzer remains
    responsible for:

    - ATS score
    - detected resume skills

    Qwen is responsible for:

    - selected domain match
    - best-fit job roles
    - matching skills and evidence
    - missing / weak evidence
    - personalized improvements
    - AI resume summary
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

    MAX_RESUME_CHARS = 18000

    if len(resume_text) > MAX_RESUME_CHARS:
        resume_text = resume_text[
            :MAX_RESUME_CHARS
        ]

    # ========================================================
    # QWEN PROMPT
    # ========================================================

    prompt = f"""
You are a professional resume evaluator inside an AI mock interview platform.

Analyze ONLY the candidate resume supplied below.

TARGET ROLE OR DOMAIN:

{selected_domain}

IMPORTANT RULES:

1. Use only information and evidence actually present in the resume.

2. Never invent:
   - skills
   - projects
   - work experience
   - certifications
   - education
   - achievements
   - tools
   - job history

3. Analyze the resume semantically.

4. Evaluate how strongly the candidate's actual resume supports the selected target:

"{selected_domain}"

5. Calculate a realistic domain match percentage from 0 to 100.

6. Recommend 3 to 5 realistic best-fit job roles based ONLY on the actual resume.

7. For every best-fit role provide:
   - role name
   - realistic match percentage
   - short evidence-based reason

8. MATCHING SKILLS: Use the EXISTING PYTHON-DETECTED SKILLS as the candidate pool. Identify ALL skills from that list that genuinely match the selected domain. If 15 or more relevant skills exist, return exactly the 15 strongest matching skills. If fewer than 15 genuinely match, return ALL genuine matches. Do NOT stop at 5. Do NOT invent skills.

9. For every matching skill explain specific evidence from the resume.

10. Identify important missing or weak evidence for the selected target domain.

11. Explain why each missing or weak area matters.

12. Give personalized resume improvements specifically for this candidate.

13. Give a concise professional AI resume summary.

14. Percentages must be integers between 0 and 100.

15. Do NOT calculate ATS score.

16. Return valid JSON only.

17. Do NOT use Markdown.

18. Do NOT put the response inside code fences.

19. Do NOT add commentary before the JSON.

20. Do NOT add commentary after the JSON.


EXISTING PYTHON-DETECTED SKILLS:

{json.dumps(
    detected_skills,
    ensure_ascii=False
)}


ACTUAL RESUME:

----- RESUME START -----

{resume_text}

----- RESUME END -----


Return EXACTLY this JSON structure.

IMPORTANT FOR PERCENTAGES:
- The numeric values below are EXAMPLES ONLY.
- NEVER copy these example values into your answer.
- Calculate every percentage from the actual resume evidence.
- domain_match_percentage must represent the actual strength of this resume for the selected domain.
- A weak match should receive a low score; a strong match should receive a high score.
- best-fit role percentages must also be based on actual resume evidence.

{{
    "selected_domain": "{selected_domain}",

    "domain_match_percentage": 50,

    "best_fit_roles": [
        {{
            "role": "Job role",
            "match_percentage": 50,
            "reason": "Evidence-based explanation"
        }}
    ],

    "matching_skills": [
        {{
            "skill": "Skill",
            "evidence": "Specific evidence from the resume"
        }}
    ],

    "missing_or_weak_evidence": [
        {{
            "area": "Area",
            "reason": "Why this evidence is missing or weak"
        }}
    ],

    "personalized_improvements": [
        "Specific personalized improvement 1",
        "Specific personalized improvement 2",
        "Specific personalized improvement 3"
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

        # ====================================================
        # IMPORTANT QWEN3 FIX
        # ====================================================
        #
        # Qwen3 has a thinking/reasoning mode.
        #
        # During our direct Ollama test the generated JSON
        # appeared inside "thinking" while "response"
        # remained empty.
        #
        # We do NOT need chain-of-thought for this task.
        # We need structured JSON in "response".
        #
        # Therefore thinking is disabled.
        # ====================================================

        "think": False,

        # Keep model loaded to make subsequent requests faster.
        "keep_alive": "10m",

        "options": {
            "temperature": 0.1,

            # Enough output for detailed resume JSON.
            "num_predict": 1800,

            # Suitable context window for normal resumes.
            "num_ctx": 8192,
        },
    }

    # ========================================================
    # SEND REQUEST TO OLLAMA
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
    # GET QWEN RESPONSE
    # ========================================================

    raw_output = _clean_text(
        ollama_response.get(
            "response",
            "",
        )
    )

    # ========================================================
    # QWEN3 COMPATIBILITY FALLBACK
    # ========================================================
    #
    # Normally think=False causes the final structured JSON
    # to appear inside:
    #
    #     ollama_response["response"]
    #
    # However, if a Qwen/Ollama version still places the
    # generated content inside "thinking", we recover it
    # instead of throwing the analysis away.
    # ========================================================

    if not raw_output:

        thinking_output = (
            ollama_response.get(
                "thinking",
                "",
            )
        )

        # ----------------------------------------------------
        # Thinking output already returned as dictionary
        # ----------------------------------------------------

        if isinstance(
            thinking_output,
            dict,
        ):

            raw_output = json.dumps(
                thinking_output,
                ensure_ascii=False,
            )

        # ----------------------------------------------------
        # Thinking output returned as string
        # ----------------------------------------------------

        else:

            raw_output = _clean_text(
                thinking_output
            )

    # ========================================================
    # NOTHING RETURNED
    # ========================================================

    if not raw_output:

        raise RuntimeError(
            "Qwen returned no usable resume analysis. "
            "Both 'response' and 'thinking' were empty."
        )

    # ========================================================
    # TEMPORARY DEBUG OUTPUT
    # ========================================================
    #
    # Keep this for now.
    #
    # This lets us see whether Qwen actually generated
    # the five required Round 1 feedback sections.
    #
    # We can remove this after everything is working.
    # ========================================================

    print(
        "\n"
        "========== QWEN RESUME ANALYSIS =========="
    )

    print(raw_output)

    print(
        "=========================================="
        "\n"
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

    # Qwen occasionally returns the example value 0 even when it generated
    # valid qualitative analysis. In that case, calculate a conservative
    # evidence-based fallback instead of exposing a misleading hard-coded 0.
    analysis["domain_match_percentage"] = _fallback_domain_match(
        selected_domain=selected_domain,
        resume_text=resume_text,
        detected_skills=detected_skills,
        analysis=analysis,
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
    # MATCHING SKILLS & EVIDENCE
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
    # AI RESUME SUMMARY
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
            analysis[
                "best_fit_roles"
            ],

        "matching_skills":
            analysis[
                "matching_skills"
            ],

        "missing_or_weak_evidence":
            analysis[
                "missing_or_weak_evidence"
            ],

        "personalized_improvements":
            analysis[
                "personalized_improvements"
            ],

        "resume_summary":
            analysis[
                "resume_summary"
            ],
    }

    # ========================================================
    # DEBUG FINAL NORMALIZED RESULT
    # ========================================================

    print(
        "\n"
        "========== NORMALIZED RESUME ANALYSIS =========="
    )

    print(
        json.dumps(
            final_analysis,
            indent=2,
            ensure_ascii=False,
        )
    )

    print(
        "================================================"
        "\n"
    )

    return final_analysis