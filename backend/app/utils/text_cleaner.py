import re
from typing import Dict, List, Optional


# ============================================================
# RESUME SECTION HEADINGS
# These are structural headings — NOT predefined skills.
# ============================================================

SECTION_ALIASES = {
    "summary": {
        "summary",
        "professional summary",
        "career summary",
        "profile",
        "professional profile",
        "career profile",
        "objective",
        "career objective",
        "about me",
        "personal profile",
    },

    "skills": {
        "skills",
        "skill",
        "key skills",
        "technical skills",
        "professional skills",
        "core skills",
        "core competencies",
        "competencies",
        "areas of expertise",
        "expertise",
        "skill set",
        "technical proficiency",
        "technical competencies",
        "professional competencies",
        "functional skills",
        "functional competencies",
        "knowledge & skills",
        "knowledge and skills",
        "tools & technologies",
        "tools and technologies",
    },

    "soft_skills": {
        "soft skills",
        "interpersonal skills",
        "personal skills",
        "people skills",
    },

    "experience": {
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "employment history",
        "work history",
        "career history",
        "professional background",
    },

    "internship": {
        "internship",
        "internships",
        "internship experience",
        "training",
        "industrial training",
    },

    "projects": {
        "projects",
        "project",
        "academic projects",
        "personal projects",
        "professional projects",
        "key projects",
        "project experience",
        "selected projects",
    },

    "education": {
        "education",
        "academic background",
        "academic qualifications",
        "educational qualifications",
        "qualification",
        "qualifications",
        "academics",
    },

    "certifications": {
        "certification",
        "certifications",
        "certificate",
        "certificates",
        "licenses",
        "licenses & certifications",
        "licenses and certifications",
        "courses",
        "professional certifications",
    },

    "achievements": {
        "achievement",
        "achievements",
        "awards",
        "honors",
        "honours",
        "awards & achievements",
        "awards and achievements",
        "accomplishments",
    },

    "activities": {
        "activities",
        "extracurricular activities",
        "extra curricular activities",
        "hackathons",
        "competitions",
        "hackathons & competitions",
        "hackathons and competitions",
        "volunteering",
    },

    "languages": {
        "languages",
        "languages known",
        "language proficiency",
    },

    "interests": {
        "interests",
        "hobbies",
        "hobbies & interests",
        "hobbies and interests",
    },

    "references": {
        "references",
        "reference",
    },
}


# ============================================================
# HEADING LOOKUP
# ============================================================

HEADING_LOOKUP = {}

for canonical, aliases in SECTION_ALIASES.items():
    for alias in aliases:
        HEADING_LOOKUP[alias] = canonical


# ============================================================
# GENERIC SKILL CATEGORY WORDS
#
# IMPORTANT:
# These are category indicators, NOT actual skills.
#
# Example:
# Programming Languages: Python, Java
#
# "Programming Languages" = category
# Python / Java = skills extracted from the resume.
# ============================================================

SKILL_CATEGORY_HINTS = {
    "skill",
    "skills",
    "competency",
    "competencies",
    "expertise",
    "technology",
    "technologies",
    "tool",
    "tools",
    "platform",
    "platforms",
    "framework",
    "frameworks",
    "library",
    "libraries",
    "database",
    "databases",
    "programming",
    "language",
    "languages",
    "analytics",
    "software",
    "technical",
    "professional",
    "functional",
    "methodology",
    "methodologies",
    "proficiency",
    "knowledge",
}


# ============================================================
# BASIC TEXT CLEANING
# ============================================================

def clean_text(text: str) -> str:

    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    # Normalize spaces while preserving lines
    text = re.sub(r"[ \t]+", " ", text)

    # Remove excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


# ============================================================
# NORMALIZE HEADING
# ============================================================

def normalize_heading(value: str) -> str:

    value = value.strip().lower()

    value = re.sub(
        r"^[•●▪■◆◇►▶➤✓✔★☆\-\–—]+\s*",
        "",
        value,
    )

    value = re.sub(
        r"[:\-–—|]+$",
        "",
        value,
    )

    value = re.sub(r"\s+", " ", value)

    return value.strip()


# ============================================================
# DETECT HEADING
# ============================================================

def detect_heading(line: str) -> Optional[str]:

    normalized = normalize_heading(line)

    return HEADING_LOOKUP.get(normalized)


# ============================================================
# VALIDATION HELPERS
# ============================================================

def is_url(value: str) -> bool:

    lower = value.lower()

    return bool(
        re.search(
            r"(https?://|www\.|github\.com|linkedin\.com)",
            lower,
        )
    )


def is_email(value: str) -> bool:

    return bool(
        re.search(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
            value,
        )
    )


def is_phone(value: str) -> bool:

    return bool(
        re.fullmatch(
            r"[\s()+\-.\d]{8,}",
            value.strip(),
        )
    )


# ============================================================
# CLEAN SKILL
# ============================================================

def clean_skill(value: str) -> str:

    value = value.strip()

    value = re.sub(
        r"^[•●▪■◆◇►▶➤✓✔★☆\-\–—]+\s*",
        "",
        value,
    )

    value = re.sub(r"\s+", " ", value)

    return value.strip(" ,;|:-")


# ============================================================
# DETECT SENTENCE
# ============================================================

def looks_like_sentence(value: str) -> bool:

    value = value.strip()

    if not value:
        return True

    words = value.split()

    # Long text is probably description text
    if len(words) > 8:
        return True

    if value.endswith("."):
        return True

    lower = value.lower()

    action_words = (
        "developed ",
        "created ",
        "built ",
        "implemented ",
        "designed ",
        "performed ",
        "analyzed ",
        "analysed ",
        "worked ",
        "managed ",
        "responsible ",
        "generated ",
        "provided ",
        "helped ",
        "completed ",
        "achieved ",
        "improved ",
        "visualized ",
        "visualised ",
        "collaborated ",
        "participated ",
        "assisted ",
        "supported ",
        "conducted ",
        "handled ",
        "led ",
    )

    if lower.startswith(action_words):
        return True

    return False


# ============================================================
# DETECT DATE
# ============================================================

def looks_like_date(value: str) -> bool:

    lower = value.lower()

    months = (
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
    )

    if re.search(r"\b(19|20)\d{2}\b", lower):

        if any(month in lower for month in months):
            return True

    return False


# ============================================================
# VALID SKILL
# ============================================================

def valid_skill(value: str) -> bool:

    value = clean_skill(value)

    if not value:
        return False

    if len(value) < 2:
        return False

    if len(value) > 80:
        return False

    if len(value.split()) > 8:
        return False

    if is_url(value):
        return False

    if is_email(value):
        return False

    if is_phone(value):
        return False

    if looks_like_date(value):
        return False

    if looks_like_sentence(value):
        return False

    # Do not treat section headings as skills
    if detect_heading(value):
        return False

    return True


# ============================================================
# SPLIT SKILL VALUES
# ============================================================

def split_skill_values(value: str) -> List[str]:

    if not value:
        return []

    # Common separators used in resumes
    value = value.replace("•", ",")
    value = value.replace("●", ",")
    value = value.replace("▪", ",")
    value = value.replace("■", ",")
    value = value.replace("◆", ",")
    value = value.replace("►", ",")
    value = value.replace("▶", ",")
    value = value.replace("➤", ",")
    value = value.replace("|", ",")
    value = value.replace(";", ",")

    parts = re.split(r",+", value)

    results = []

    for part in parts:

        part = clean_skill(part)

        if valid_skill(part):
            results.append(part)

    return results


# ============================================================
# DETECT CATEGORY : VALUE SKILL LINES
# ============================================================

def looks_like_skill_category(category: str) -> bool:

    category = clean_skill(category).lower()

    if not category:
        return False

    # Category names should normally be short
    if len(category.split()) > 6:
        return False

    words = set(
        re.findall(
            r"[a-zA-Z]+",
            category,
        )
    )

    return bool(words & SKILL_CATEGORY_HINTS)


def extract_category_skills(line: str) -> List[str]:

    if ":" not in line:
        return []

    category, values = line.split(":", 1)

    category = clean_skill(category)
    values = values.strip()

    if not category or not values:
        return []

    if not looks_like_skill_category(category):
        return []

    return split_skill_values(values)


# ============================================================
# DYNAMIC SKILL EXTRACTION
# ============================================================

def extract_skills_from_text(text: str) -> List[str]:
    """
    Extract skills dynamically from the uploaded resume.

    There is NO predefined technical/non-technical skill list.

    Supports examples such as:

    SKILLS
    • Python
    • SQL
    • Power BI

    SKILLS
    Python | SQL | Power BI

    Programming Languages: Python, Java, C++
    Databases: MySQL, PostgreSQL

    CORE COMPETENCIES
    • Recruitment
    • Talent Acquisition
    • Leadership
    """

    text = clean_text(text)

    if not text:
        return []

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    skills: List[str] = []

    current_section: Optional[str] = None

    for line in lines:

        # ----------------------------------------------------
        # Detect section heading
        # ----------------------------------------------------

        heading = detect_heading(line)

        if heading:

            current_section = heading

            continue

        # ----------------------------------------------------
        # METHOD 1:
        # Category:value skills anywhere in resume
        #
        # Programming Languages: Python, Java
        # Databases: MySQL, PostgreSQL
        # Analytics Tools: Excel, Power BI
        # ----------------------------------------------------

        category_skills = extract_category_skills(line)

        if category_skills:

            skills.extend(category_skills)

            continue

        # ----------------------------------------------------
        # METHOD 2:
        # Content inside Skills / Soft Skills section
        # ----------------------------------------------------

        if current_section in {"skills", "soft_skills"}:

            if is_url(line):
                continue

            if is_email(line):
                continue

            if looks_like_date(line):
                continue

            if looks_like_sentence(line):
                continue

            values = split_skill_values(line)

            skills.extend(values)

    # ========================================================
    # REMOVE DUPLICATES
    # ========================================================

    unique_skills = []

    seen = set()

    for skill in skills:

        skill = clean_skill(skill)

        if not valid_skill(skill):
            continue

        key = skill.casefold()

        if key in seen:
            continue

        seen.add(key)

        unique_skills.append(skill)

    return unique_skills


# ============================================================
# SECTION DETECTION
# ============================================================

def extract_sections(text: str) -> Dict[str, bool]:

    text = clean_text(text)

    found = {
        "summary": False,
        "skills": False,
        "experience": False,
        "internship": False,
        "projects": False,
        "education": False,
        "certifications": False,
        "achievements": False,
    }

    for line in text.split("\n"):

        heading = detect_heading(line)

        if heading == "summary":

            found["summary"] = True

        elif heading in {"skills", "soft_skills"}:

            found["skills"] = True

        elif heading == "experience":

            found["experience"] = True

        elif heading == "internship":

            found["internship"] = True

        elif heading == "projects":

            found["projects"] = True

        elif heading == "education":

            found["education"] = True

        elif heading == "certifications":

            found["certifications"] = True

        elif heading in {"achievements", "activities"}:

            found["achievements"] = True

    # Structured skill extraction also proves skills exist
    if extract_skills_from_text(text):

        found["skills"] = True

    return found


# ============================================================
# RESUME DOCUMENT VALIDATION — TASK 10
# ============================================================

def validate_resume_document(text: str) -> bool:
    """
    Validate whether the uploaded PDF appears to be a real
    resume/CV.

    IMPORTANT:
    - This function ONLY validates the document.
    - Existing ATS scoring is NOT changed.
    - Existing skill extraction is NOT changed.
    - Existing analyze_resume() is NOT changed.
    - Random PDFs, source-code documents and project
      documentation should be rejected.
    """

    # --------------------------------------------------------
    # 1. Basic text validation
    # --------------------------------------------------------

    text = clean_text(text)

    if not text:
        return False

    lower_text = text.lower()

    # --------------------------------------------------------
    # 2. Minimum document size
    # --------------------------------------------------------

    word_count = len(text.split())

    if word_count < 40:
        return False

    # --------------------------------------------------------
    # 3. Reject obvious source-code documents
    # --------------------------------------------------------

    code_markers = [
        "from fastapi import",
        "from motor.motor_asyncio import",
        "from backend.app.",
        "import os",
        "import shutil",
        "import uuid",
        "import asyncio",
        "import react",
        "import axios",
        "async def ",
        "def ",
        "class ",
        "apirouter(",
        "router = apirouter",
        "api.post(",
        "api.get(",
        "useeffect(",
        "usestate(",
        "usecontext(",
        "localhost:",
        "backend/app/",
        "frontend/src/",
        "package.json",
        "requirements.txt",
        "model_dump(",
        "pydantic",
        "fastapi",
        "motor.motor_asyncio",
        "mongodb",
        "mongoose",
        "express",
        "uvicorn",
        "axios.create(",
        "return {",
        "try:",
        "except ",
        "await ",
    ]

    code_marker_count = sum(
        1
        for marker in code_markers
        if marker in lower_text
    )

    # A genuine resume may mention programming languages,
    # but it should not contain several source-code markers.
    if code_marker_count >= 2:
        return False

    # --------------------------------------------------------
    # 4. Reject technical/project documentation
    # --------------------------------------------------------

    documentation_markers = [
        "technical handoff",
        "project architecture",
        "system architecture",
        "software architecture",
        "api documentation",
        "api contract",
        "file-by-file responsibilities",
        "file by file responsibilities",
        "project file inventory",
        "source code",
        "implementation details",
        "backend directory",
        "frontend directory",
        "frontend source",
        "backend source",
        "directory structure",
        "folder structure",
        "code structure",
        "installation commands",
        "run commands",
        "deployment instructions",
        "database schema",
        "endpoint",
        "endpoints",
        "request body",
        "response body",
        "project structure",
    ]

    documentation_count = sum(
        1
        for marker in documentation_markers
        if marker in lower_text
    )

    # Multiple documentation indicators strongly suggest
    # that the PDF is not a resume.
    if documentation_count >= 2:
        return False

    # --------------------------------------------------------
    # 5. Detect programming syntax
    # --------------------------------------------------------

    code_patterns = [
        r"\bimport\s+[a-zA-Z_][\w.]*",
        r"\bfrom\s+[a-zA-Z_][\w.]*\s+import\b",
        r"\basync\s+def\b",
        r"\bdef\s+\w+\s*\(",
        r"\bclass\s+\w+\s*[\(:]",
        r"\bawait\s+\w+",
        r"\btry\s*:",
        r"\bexcept\s+",
        r"\breturn\s+",
        r"\bconst\s+\w+\s*=",
        r"\blet\s+\w+\s*=",
        r"=>",
    ]

    code_pattern_count = sum(
        len(
            re.findall(
                pattern,
                text,
                re.IGNORECASE,
            )
        )
        for pattern in code_patterns
    )

    if code_pattern_count >= 8:
        return False

    # --------------------------------------------------------
    # 6. Detect resume sections
    # --------------------------------------------------------

    sections = extract_sections(text)

    section_count = sum(
        1
        for value in sections.values()
        if value
    )

    # --------------------------------------------------------
    # 7. Contact information
    # --------------------------------------------------------

    has_email = bool(
        re.search(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
            text,
        )
    )

    has_phone = bool(
        re.search(
            r"(?:\+?\d[\d\s().-]{7,}\d)",
            text,
        )
    )

    # --------------------------------------------------------
    # 8. Resume-specific keywords
    # --------------------------------------------------------

    resume_keywords = [
        "resume",
        "curriculum vitae",
        "cv",
        "professional summary",
        "career objective",
        "career summary",
        "professional profile",
        "work experience",
        "professional experience",
        "employment history",
        "education",
        "academic background",
        "technical skills",
        "professional skills",
        "skills",
        "projects",
        "internship",
        "internships",
        "certifications",
        "achievements",
        "qualifications",
        "experience",
    ]

    keyword_count = sum(
        1
        for keyword in resume_keywords
        if keyword in lower_text
    )

    # --------------------------------------------------------
    # 9. Strong resume validation
    # --------------------------------------------------------

    # A resume with 3 or more recognized sections
    # is considered a valid resume.
    if section_count >= 3:
        return True

    # Contact information + at least 2 resume sections
    # + resume terminology.
    if (
        (has_email or has_phone)
        and section_count >= 2
        and keyword_count >= 2
    ):
        return True

    # Contact information + strong resume vocabulary
    # + enough content.
    if (
        (has_email or has_phone)
        and keyword_count >= 4
        and word_count >= 80
    ):
        return True

    # --------------------------------------------------------
    # 10. Everything else is rejected
    # --------------------------------------------------------

    return False


# ============================================================
# DYNAMIC ATS-STYLE RESUME QUALITY SCORE
# ============================================================

def analyze_resume(text: str) -> dict:
    """
    Calculate a dynamic ATS-style resume quality score.

    IMPORTANT:
    - No predefined technical/non-technical skills are used.
    - Extracted skills come from the resume itself.
    - Score measures resume quality, not job/domain match.
    - Different resumes can receive different scores.
    """

    text = clean_text(text)

    if not text:

        return {
            "score": 0,
            "skills": [],
            "sections": {},
        }

    skills = extract_skills_from_text(text)

    sections = extract_sections(text)

    score = 0.0

    lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip()
    ]

    word_count = len(text.split())

    # ========================================================
    # 1. CONTACT INFORMATION — MAX 10
    # ========================================================

    email_found = bool(
        re.search(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
            text,
        )
    )

    phone_found = bool(
        re.search(
            r"(?:\+?\d[\d\s().-]{7,}\d)",
            text,
        )
    )

    linkedin_found = bool(
        re.search(
            r"(linkedin\.com|linkedin\s*:)",
            text,
            re.IGNORECASE,
        )
    )

    if email_found:
        score += 4

    if phone_found:
        score += 4

    if linkedin_found:
        score += 2

    # ========================================================
    # 2. PROFESSIONAL SUMMARY — MAX 10
    # ========================================================

    if sections.get("summary"):

        # Summary heading
        score += 4

        summary_words = 0

        inside_summary = False

        for line in lines:

            heading = detect_heading(line)

            if heading == "summary":

                inside_summary = True

                continue

            if inside_summary and heading:

                break

            if inside_summary:

                summary_words += len(line.split())

        # Good summary content
        if 20 <= summary_words <= 120:

            score += 4

        elif summary_words > 0:

            score += 2

        # Descriptive summary
        if summary_words >= 35:

            score += 2

    # ========================================================
    # 3. SKILLS QUALITY — MAX 15
    # ========================================================

    skill_count = len(skills)

    if sections.get("skills") or skill_count > 0:

        score += 4

        if 3 <= skill_count <= 5:

            score += 3

        elif 6 <= skill_count <= 10:

            score += 5

        elif 11 <= skill_count <= 25:

            score += 7

        elif skill_count > 25:

            # Prevent unlimited keyword-stuffing reward
            score += 6

        # Check whether skills are structured
        category_skill_lines = 0

        for line in lines:

            if extract_category_skills(line):

                category_skill_lines += 1

        if category_skill_lines >= 2:

            score += 4

        elif category_skill_lines == 1:

            score += 2

    # ========================================================
    # 4. EDUCATION — MAX 10
    # ========================================================

    if sections.get("education"):

        score += 5

        education_terms = bool(
            re.search(
                r"\b("
                r"b\.?tech|m\.?tech|bachelor|master|mba|"
                r"bca|mca|bsc|msc|degree|diploma|"
                r"university|college|school"
                r")\b",
                text,
                re.IGNORECASE,
            )
        )

        if education_terms:

            score += 3

        education_year = bool(
            re.search(
                r"\b(19|20)\d{2}\b",
                text,
            )
        )

        if education_year:

            score += 2

    # ========================================================
    # 5. EXPERIENCE / INTERNSHIP QUALITY — MAX 15
    # ========================================================

    has_experience = (
        sections.get("experience")
        or sections.get("internship")
    )

    if has_experience:

        score += 5

        action_pattern = re.compile(
            r"\b("
            r"developed|created|built|implemented|designed|"
            r"performed|analyzed|analysed|managed|generated|"
            r"improved|collaborated|conducted|assisted|"
            r"supported|led|optimized|automated|delivered"
            r")\b",
            re.IGNORECASE,
        )

        action_count = len(
            action_pattern.findall(text)
        )

        if action_count >= 6:

            score += 5

        elif action_count >= 3:

            score += 3

        elif action_count >= 1:

            score += 1

        # ----------------------------------------------------
        # Measurable impact
        #
        # Examples:
        # 25%
        # 10,000+
        # 500+
        # ----------------------------------------------------

        metric_pattern = re.compile(
            r"\b\d+(?:\.\d+)?%|"
            r"\b\d{1,3}(?:,\d{3})+\+?|"
            r"\b\d+\+\b",
            re.IGNORECASE,
        )

        metric_count = len(
            metric_pattern.findall(text)
        )

        if metric_count >= 3:

            score += 5

        elif metric_count >= 1:

            score += 3

    # ========================================================
    # 6. PROJECT QUALITY — MAX 15
    # ========================================================

    if sections.get("projects"):

        score += 5

        project_action_pattern = re.compile(
            r"\b("
            r"developed|created|built|implemented|designed|"
            r"trained|analyzed|analysed|visualized|visualised|"
            r"deployed|integrated|automated|generated|"
            r"optimized|improved"
            r")\b",
            re.IGNORECASE,
        )

        project_actions = len(
            project_action_pattern.findall(text)
        )

        if project_actions >= 5:

            score += 5

        elif project_actions >= 2:

            score += 3

        elif project_actions >= 1:

            score += 1

        # Project measurable outcomes

        project_metrics = len(
            re.findall(
                r"\b\d+(?:\.\d+)?%|"
                r"\b\d{1,3}(?:,\d{3})+\+?|"
                r"\b\d+\+\b",
                text,
            )
        )

        if project_metrics >= 2:

            score += 5

        elif project_metrics == 1:

            score += 3

    # ========================================================
    # 7. CERTIFICATIONS / ACHIEVEMENTS — MAX 10
    # ========================================================

    if sections.get("certifications"):

        score += 5

    if sections.get("achievements"):

        score += 3

    if (
        sections.get("certifications")
        and sections.get("achievements")
    ):

        score += 2

    # ========================================================
    # 8. READABILITY / RESUME LENGTH — MAX 10
    # ========================================================

    if 250 <= word_count <= 900:

        score += 7

    elif 180 <= word_count < 250:

        score += 5

    elif 900 < word_count <= 1200:

        score += 5

    elif 120 <= word_count < 180:

        score += 3

    elif 1200 < word_count <= 1500:

        score += 3

    # Reasonable line structure

    if 15 <= len(lines) <= 150:

        score += 3

    elif len(lines) > 5:

        score += 1

    # ========================================================
    # FINAL ATS SCORE
    # ========================================================

    final_score = round(score)

    final_score = max(
        0,
        min(final_score, 100),
    )

    return {
        "score": final_score,
        "skills": skills,
        "sections": sections,
    }