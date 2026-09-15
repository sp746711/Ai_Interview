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
# Keep local resume analysis responsive. The old 420s + 300s retry path
# could block the request for more than 12 minutes before returning fallback.
# The feedback generation runs in the background, so give the local model
# enough time to finish instead of forcing an early fallback.
# Streaming is also enabled below so the read timeout is not triggered just
# because Qwen is generating a long JSON response.
OLLAMA_TIMEOUT = 300.0
OLLAMA_RETRY_TIMEOUT = 180.0

# Keep the prompt bounded for the local 4B model.
MAX_RESUME_CHARS = 12000
COMPACT_RESUME_CHARS = 8000


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
# BOUND RESUME TEXT
# ============================================================

def _bound_resume_text(
    resume_text: str,
    max_chars: int,
) -> str:
    """
    Keep both the beginning and end of a long resume.

    The beginning usually contains the profile/experience and the end often
    contains education, projects, certifications, or skills. Keeping only
    the first N characters can silently remove useful evidence.
    """

    resume_text = _clean_text(resume_text)

    if len(resume_text) <= max_chars:
        return resume_text

    head_chars = int(max_chars * 0.65)
    tail_chars = max_chars - head_chars

    return (
        resume_text[:head_chars].rstrip()
        + "\n\n[...middle of resume omitted to keep local analysis fast...]\n\n"
        + resume_text[-tail_chars:].lstrip()
    )


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

    Accept a few common field aliases so a slightly different but valid
    Qwen JSON response is not silently discarded.
    """

    if not isinstance(value, list):
        return []

    result = []

    for item in value[:5]:

        if isinstance(item, str):
            role = item.strip()
            if role:
                result.append({
                    "role": role,
                    "match_percentage": 0,
                    "reason": "Role suggested from the resume evidence.",
                })
            continue

        if not isinstance(item, dict):
            continue

        role = _clean_text(
            item.get("role")
            or item.get("job_role")
            or item.get("title")
            or item.get("position")
        )

        reason = _clean_text(
            item.get("reason")
            or item.get("evidence")
            or item.get("explanation")
        )

        raw_percentage = (
            item.get("match_percentage")
            if item.get("match_percentage") is not None
            else item.get("match")
        )

        percentage = _safe_int(raw_percentage, 0)

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
    seen = set()

    for item in value[:15]:

        if isinstance(item, str):
            skill = item.strip()
            evidence = "Skill detected in the resume."
        elif isinstance(item, dict):
            skill = _clean_text(
                item.get("skill")
                or item.get("name")
                or item.get("skill_name")
            )
            evidence = _clean_text(
                item.get("evidence")
                or item.get("reason")
                or item.get("explanation")
                or item.get("source")
            )
        else:
            continue

        if not skill:
            continue

        key = skill.casefold()
        if key in seen:
            continue

        seen.add(key)

        result.append(
            {
                "skill": skill,
                "evidence": evidence or "Skill detected in the resume.",
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

        if isinstance(item, str):
            text = item.strip()

            if text:
                result.append(
                    {
                        "area": text,
                        "reason": "This area needs stronger evidence in the resume.",
                    }
                )

            continue

        if not isinstance(item, dict):
            continue

        area = _clean_text(
            item.get("area")
            or item.get("skill")
            or item.get("topic")
            or item.get("category")
        )

        reason = _clean_text(
            item.get("reason")
            or item.get("evidence")
            or item.get("explanation")
        )

        if not area:
            continue

        result.append(
            {
                "area": area,
                "reason": reason or "This area needs stronger evidence in the resume.",
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
# ROUND 1 SCORE CONSISTENCY HELPERS
# ============================================================

def _domain_role_overlap(
    selected_domain: str,
    role: str,
) -> bool:
    """Return True when the role clearly belongs to the selected domain."""
    domain = _clean_text(selected_domain).casefold()
    role_text = _clean_text(role).casefold()

    if not domain or not role_text:
        return False

    # Strong phrase matches first.
    domain_phrases = {
        "frontend development": ["frontend", "front-end", "react", "javascript"],
        "full-stack development": ["full-stack", "full stack", "frontend", "backend"],
        "backend development": ["backend", "back-end", "api", "server"],
        "cybersecurity": ["cybersecurity", "cyber security", "security", "infosec"],
        "data analytics": ["data analyst", "data analytics", "analytics"],
        "data analyst": ["data analyst", "analytics"],
        "machine learning": ["machine learning", "ml engineer", "ai/ml"],
        "machine learning engineer": ["machine learning", "ml engineer"],
        "software engineering": ["software engineer", "software developer"],
        "software engineer": ["software engineer", "software developer"],
        "generative ai": ["generative ai", "genai", "llm"],
        "llm engineering": ["llm", "generative ai"],
    }

    phrases = domain_phrases.get(domain, [])

    if any(phrase in role_text for phrase in phrases):
        return True

    # Generic token overlap for domains not listed above.
    ignored = {
        "development", "engineering", "engineer", "developer",
        "technology", "technologies", "management", "professional",
        "and", "the", "of", "for",
    }

    domain_tokens = {
        token
        for token in re.findall(r"[a-z0-9+#.-]+", domain)
        if len(token) >= 4 and token not in ignored
    }
    role_tokens = {
        token
        for token in re.findall(r"[a-z0-9+#.-]+", role_text)
        if len(token) >= 4 and token not in ignored
    }

    return bool(domain_tokens & role_tokens)


def _repair_domain_score_consistency(
    selected_domain: str,
    domain_score: int,
    best_fit_roles: list[dict],
) -> int:
    """
    Preserve normal Qwen domain scores.

    Only repair a contradictory zero when Qwen simultaneously recommends a
    clearly domain-aligned top role with a strong match score. This avoids
    turning a legitimate low domain score into an artificially high score.
    """
    score = _safe_int(domain_score, 0)

    if score != 0 or not isinstance(best_fit_roles, list):
        return score

    for item in best_fit_roles[:3]:
        if not isinstance(item, dict):
            continue

        role = _clean_text(item.get("role"))
        role_score = _safe_int(item.get("match_percentage"), 0)

        if (
            role_score >= 70
            and _domain_role_overlap(selected_domain, role)
        ):
            # Conservative correction: never exceed 85 and keep a 10-point
            # gap from the top role so domain fit is not overstated.
            return max(60, min(85, role_score - 10))

    return score


def _calculate_overall_match(
    domain_score: int,
    best_fit_roles: list[dict],
    matching_skills: list[dict],
    detected_skills: list[str],
) -> int:
    """
    Calculate the Round 1 Overall Match from semantic resume evidence.

    ATS is intentionally not included here because ATS is produced by the
    existing Python resume analyzer. This score is a Round 1 career-fit
    measure, not an ATS replacement.
    """
    domain = _safe_int(domain_score, 0)

    role_scores = []
    for item in best_fit_roles[:3]:
        if isinstance(item, dict):
            role_scores.append(
                _safe_int(item.get("match_percentage"), 0)
            )

    top_role = max(role_scores) if role_scores else domain

    detected_count = len(
        {
            _clean_text(skill).casefold()
            for skill in detected_skills
            if _clean_text(skill)
        }
    )

    matching_count = len(
        {
            _clean_text(item.get("skill")).casefold()
            for item in matching_skills
            if isinstance(item, dict)
            and _clean_text(item.get("skill"))
        }
    )

    if detected_count:
        skill_coverage = min(
            100,
            round((matching_count / detected_count) * 100),
        )
    else:
        skill_coverage = 0

    # Domain fit is the primary signal, role fit is secondary, and verified
    # skill evidence is a supporting signal.
    overall = round(
        (domain * 0.50)
        + (top_role * 0.35)
        + (skill_coverage * 0.15)
    )

    return max(0, min(100, overall))


# ============================================================
# MAIN RESUME AI ANALYSIS
# ============================================================


# ============================================================
# ROUND 1 PROMPT BUILDER
# ============================================================

def _build_resume_prompt(
    resume_text: str,
    selected_domain: str,
    detected_skills: list[str],
    compact: bool = False,
) -> str:
    """Build a bounded prompt for local Qwen resume analysis."""
    skills_text = json.dumps(detected_skills[:40], ensure_ascii=False)

    if compact:
        instruction = """
Analyze only the supplied resume evidence. Be concise.
The domain_match_percentage must be consistent with the recommended roles.
Use 0 only when there is essentially no meaningful evidence for the target domain.
Never invent skills, experience, projects, education, certifications,
achievements, tools, or percentages.
Use the detected-skills list only as a candidate pool and verify matches
against the resume text. Do not calculate ATS.
Return JSON only, with no markdown or commentary.
Return up to 3 best-fit roles, up to 10 matching skills, up to 5 weak/missing
areas, and up to 5 personalized improvements. Keep every reason/evidence short.
Keep resume_summary under 40 words. Always finish the complete JSON object.
""".strip()
        output_shape = """
{
  "selected_domain": "target domain",
  "domain_match_percentage": 0,
  "best_fit_roles": [{"role":"Job role","match_percentage":0,"reason":"Evidence-based reason"}],
  "matching_skills": [{"skill":"Skill","evidence":"Evidence from resume"}],
  "missing_or_weak_evidence": [{"area":"Area","reason":"Why weak or missing"}],
  "personalized_improvements": ["Specific improvement"],
  "resume_summary": "Concise professional assessment"
}
""".strip()
    else:
        instruction = """
Analyze ONLY the candidate resume supplied below.
Use only information actually present in the resume.
Never invent skills, projects, work experience, certifications, education,
achievements, tools, job history, or measurements.
Evaluate semantic alignment with the selected target domain.
The domain_match_percentage must be consistent with the resume evidence and
the recommended roles. Use 0 only when there is essentially no meaningful
evidence for the selected domain. If a strongly domain-aligned role is
recommended with a high match, do not assign the target domain a contradictory
0 score.
Recommend 3 to 5 realistic best-fit roles based only on the resume.
For every role provide a realistic match percentage and evidence-based reason.
Use the existing Python-detected skills as the candidate pool. Identify all
skills that genuinely match the selected domain, up to 15 strongest matches.
For every matching skill provide specific resume evidence.
Identify important missing or weak evidence and explain why it matters.
Give personalized resume improvements for this candidate.
Give a concise professional AI resume summary.
All percentages must be integers from 0 to 100.
Do NOT calculate ATS score.
Keep resume_summary under 40 words.
Return valid JSON only. No Markdown. No code fences. No commentary.
Always finish the complete JSON object.
""".strip()
        output_shape = """
{
  "selected_domain": "target domain",
  "domain_match_percentage": 0,
  "best_fit_roles": [
    {"role":"Job role","match_percentage":0,"reason":"Evidence-based explanation"}
  ],
  "matching_skills": [
    {"skill":"Skill","evidence":"Specific evidence from the resume"}
  ],
  "missing_or_weak_evidence": [
    {"area":"Area","reason":"Why this evidence is missing or weak"}
  ],
  "personalized_improvements": ["Specific personalized improvement"],
  "resume_summary": "Professional semantic assessment of this resume."
}
""".strip()

    return f"""
You are a professional resume evaluator inside an AI mock interview platform.

TARGET ROLE OR DOMAIN:
{selected_domain}

{instruction}

EXISTING PYTHON-DETECTED SKILLS:
{skills_text}

ACTUAL RESUME:
----- RESUME START -----
{resume_text}
----- RESUME END -----

Return EXACTLY this JSON structure. Numeric values in the schema are placeholders;
calculate every value from the actual evidence.

{output_shape}
""".strip()


# ============================================================
# OLLAMA GENERATION HELPER
# ============================================================

async def _generate_with_ollama(
    prompt: str,
    read_timeout: float,
) -> dict:
    """
    Call Ollama using streaming.

    Ollama normally streams small JSON/response chunks while the model is
    generating. Using stream=True prevents httpx from waiting for the entire
    generation before receiving the first response body.
    """

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": True,
        "format": "json",
        "think": False,
        "keep_alive": "10m",
        "options": {
            "temperature": 0.1,
            "num_predict": 1200,
            "num_ctx": 4096,
        },
    }

    timeout = httpx.Timeout(
        connect=20.0,
        read=read_timeout,
        write=30.0,
        pool=20.0,
    )

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/generate",
                json=payload,
            ) as response:

                response.raise_for_status()

                response_parts = []
                thinking_parts = []
                final_data = {}

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    try:
                        chunk = json.loads(line)
                    except json.JSONDecodeError:
                        # Ignore malformed/non-JSON stream fragments.
                        continue

                    if not isinstance(chunk, dict):
                        continue

                    final_data.update(
                        {
                            key: value
                            for key, value in chunk.items()
                            if key not in {"response", "thinking"}
                        }
                    )

                    chunk_response = chunk.get("response")
                    if isinstance(chunk_response, str):
                        response_parts.append(chunk_response)

                    chunk_thinking = chunk.get("thinking")
                    if isinstance(chunk_thinking, str):
                        thinking_parts.append(chunk_thinking)

                final_data["response"] = "".join(response_parts).strip()

                if thinking_parts:
                    final_data["thinking"] = "".join(thinking_parts).strip()

                return final_data

    except httpx.ConnectTimeout as exc:
        raise RuntimeError(
            "Ollama connection timed out while starting Qwen3. "
            "Make sure Ollama is running and qwen3:4b is available."
        ) from exc

    except httpx.ReadTimeout as exc:
        raise RuntimeError(
            f"Ollama read timeout after {read_timeout:.0f} seconds while "
            "Qwen3 was generating the resume analysis."
        ) from exc

    except httpx.WriteTimeout as exc:
        raise RuntimeError(
            "Ollama write timeout while sending the resume analysis request."
        ) from exc

    except httpx.PoolTimeout as exc:
        raise RuntimeError(
            "Ollama client connection pool timed out before the resume "
            "analysis request could run."
        ) from exc

    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code if exc.response else "unknown"
        detail = ""

        try:
            detail = _clean_text(exc.response.text)[:300]
        except Exception:
            pass

        message = f"Ollama returned HTTP error {status}."

        if detail:
            message += f" {detail}"

        raise RuntimeError(message) from exc

    except httpx.RequestError as exc:
        raise RuntimeError(
            f"Ollama request failed: {str(exc)}"
        ) from exc


# ============================================================
# SAFE ROUND 1 FALLBACK
# ============================================================

def _build_resume_fallback(
    resume_text: str,
    selected_domain: str,
    detected_skills: list[str],
    error: str,
) -> dict:
    """Return useful evidence-based feedback if local Qwen is unavailable."""
    resume_lower = resume_text.lower()
    domain_lower = selected_domain.lower()

    relevant_skills = []
    for skill in detected_skills:
        clean = _clean_text(skill)
        if clean and clean.lower() in resume_lower:
            relevant_skills.append({
                "skill": clean,
                "evidence": "This skill was detected in the resume and appears in the extracted resume text.",
            })

    domain_terms = [
        token for token in re.findall(r"[a-zA-Z][a-zA-Z0-9+#./-]*", domain_lower)
        if len(token) >= 3
    ]
    matched_terms = sum(1 for token in domain_terms if token in resume_lower)
    domain_score = round((matched_terms / len(domain_terms)) * 100) if domain_terms else 0
    if relevant_skills:
        domain_score = max(domain_score, min(75, len(relevant_skills) * 5))

    roles = []
    if selected_domain:
        roles.append({
            "role": selected_domain,
            "match_percentage": domain_score,
            "reason": "This role is based on the selected domain; detailed semantic role matching requires the local LLM analysis.",
        })

    missing = [{
        "area": "Role-specific evidence",
        "reason": "A detailed role-specific evidence analysis could not be completed because the local LLM request failed.",
    }]

    if not relevant_skills:
        missing[0] = {
            "area": f"Evidence for {selected_domain}",
            "reason": "The resume does not provide enough explicit evidence for an automatic domain match during the LLM recovery path.",
        }

    improvements = [
        f"Add concrete achievements and project outcomes that demonstrate readiness for {selected_domain}.",
        "Quantify important project or work results where the resume currently gives only responsibilities.",
    ]

    return {
        "selected_domain": selected_domain,
        "analysis_domain": selected_domain,
        "domain_match_percentage": max(0, min(100, domain_score)),
        "overall_match_percentage": max(0, min(100, domain_score)),
        "best_fit_roles": roles[:5],
        "matching_skills": relevant_skills[:15],
        "missing_or_weak_evidence": missing[:10],
        "personalized_improvements": improvements[:10],
        "resume_summary": (
            f"A recovery analysis was generated from the stored resume evidence for {selected_domain}. "
            "The detailed semantic LLM analysis was unavailable, so this result should be treated as a fallback."
        ),
        "generation_source": "fallback",
        "generation_error": error,
    }


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
    # LIMIT RESUME TEXT TO KEEP LOCAL QWEN RESPONSIVE
    # ========================================================

    resume_text = _bound_resume_text(
        resume_text,
        MAX_RESUME_CHARS,
    )

    # ========================================================
    # QWEN PROMPT
    # ========================================================

    # Use the compact prompt on the first attempt. The local 4B model is
    # much faster with bounded context and a small structured output.
    prompt = _build_resume_prompt(
        resume_text=resume_text,
        selected_domain=selected_domain,
        detected_skills=detected_skills,
        compact=True,
    )

    # ========================================================
    # SEND REQUEST TO OLLAMA
    # ========================================================

    try:
        ollama_response = await _generate_with_ollama(
            prompt=prompt,
            read_timeout=OLLAMA_TIMEOUT,
        )

    except RuntimeError as first_error:
        first_message = str(first_error)

        # Retry only for a generation/read timeout, using a smaller resume
        # context. Other errors are not retried blindly.
        if "read timeout" not in first_message.lower():
            return _build_resume_fallback(
                resume_text=resume_text,
                selected_domain=selected_domain,
                detected_skills=detected_skills,
                error=first_message,
            )

        compact_prompt = _build_resume_prompt(
            resume_text=_bound_resume_text(
                resume_text,
                COMPACT_RESUME_CHARS,
            ),
            selected_domain=selected_domain,
            detected_skills=detected_skills,
            compact=True,
        )

        try:
            ollama_response = await _generate_with_ollama(
                prompt=compact_prompt,
                read_timeout=OLLAMA_RETRY_TIMEOUT,
            )
        except RuntimeError as second_error:
            return _build_resume_fallback(
                resume_text=resume_text,
                selected_domain=selected_domain,
                detected_skills=detected_skills,
                error=(
                    f"Initial Ollama attempt failed: {first_message}; "
                    f"retry failed: {str(second_error)}"
                ),
            )

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

    try:
        analysis = _extract_json(
            raw_output
        )
    except Exception as exc:
        return _build_resume_fallback(
            resume_text=resume_text,
            selected_domain=selected_domain,
            detected_skills=detected_skills,
            error=f"Qwen returned unusable JSON: {str(exc)}",
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

    raw_domain_score = analysis.get("domain_match_percentage")

    try:
        if isinstance(raw_domain_score, str):
            raw_domain_score = raw_domain_score.replace("%", "").strip()

        parsed_domain_score = int(float(raw_domain_score))
    except (TypeError, ValueError):
        parsed_domain_score = None

    # Qwen is the primary semantic evaluator. Keep its valid score exactly
    # as returned, including a legitimate 0. Only use the heuristic fallback
    # when Qwen did not provide a usable numeric percentage.
    if parsed_domain_score is None:
        analysis["domain_match_percentage"] = _fallback_domain_match(
            selected_domain=selected_domain,
            resume_text=resume_text,
            detected_skills=detected_skills,
            analysis=analysis,
        )
    else:
        analysis["domain_match_percentage"] = max(
            0,
            min(100, parsed_domain_score),
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
    # OVERALL ROUND 1 MATCH
    # ========================================================

    analysis["domain_match_percentage"] = _repair_domain_score_consistency(
        selected_domain=selected_domain,
        domain_score=analysis["domain_match_percentage"],
        best_fit_roles=analysis["best_fit_roles"],
    )

    analysis["overall_match_percentage"] = _calculate_overall_match(
        domain_score=analysis["domain_match_percentage"],
        best_fit_roles=analysis["best_fit_roles"],
        matching_skills=analysis["matching_skills"],
        detected_skills=detected_skills,
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

    raw_improvements = analysis.get(
        "personalized_improvements",
        [],
    )

    if isinstance(raw_improvements, list):
        normalized_improvements = []

        for item in raw_improvements[:10]:
            if isinstance(item, str):
                value = _clean_text(item)
            elif isinstance(item, dict):
                value = _clean_text(
                    item.get("improvement")
                    or item.get("recommendation")
                    or item.get("action")
                    or item.get("text")
                    or item.get("reason")
                )
            else:
                value = ""

            if value and value not in normalized_improvements:
                normalized_improvements.append(value)

        analysis["personalized_improvements"] = normalized_improvements
    else:
        analysis["personalized_improvements"] = []

    # ========================================================
    # AI RESUME SUMMARY
    # ========================================================

    analysis["resume_summary"] = _clean_text(
        analysis.get("resume_summary")
        or analysis.get("summary")
        or analysis.get("professional_summary")
        or analysis.get("assessment")
    )

    # Keep the final summary concise for stable local Qwen generation/output.
    if len(analysis["resume_summary"]) > 300:
        analysis["resume_summary"] = (
            analysis["resume_summary"][:300].rsplit(" ", 1)[0].rstrip(" ,.;:")
            + "."
        )

    # ========================================================
    # VALIDATE THAT QWEN RETURNED MEANINGFUL CONTENT
    # ========================================================

    has_meaningful_analysis = any(
        [
            bool(analysis.get("resume_summary")),
            bool(analysis.get("best_fit_roles")),
            bool(analysis.get("matching_skills")),
            bool(analysis.get("missing_or_weak_evidence")),
            bool(analysis.get("personalized_improvements")),
        ]
    )

    if not has_meaningful_analysis:
        return _build_resume_fallback(
            resume_text=resume_text,
            selected_domain=selected_domain,
            detected_skills=detected_skills,
            error="Qwen returned valid JSON but no usable Round 1 analysis sections.",
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

        "overall_match_percentage":
            analysis[
                "overall_match_percentage"
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

        "generation_source": "llm",
        "generation_error": None,
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