import os
import shutil
import uuid

from fastapi import UploadFile

from backend.app.utils.pdf_parser import extract_text_from_pdf
from backend.app.utils.text_cleaner import analyze_resume


# ============================================================
# UPLOAD DIRECTORY
# ============================================================

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ResumeService:

    # ========================================================
    # PROCESS RESUME
    # ========================================================

    @staticmethod
    async def process_resume(
        file: UploadFile,
        role: str
    ) -> dict:

        # ----------------------------------------------------
        # 1. Validate uploaded file
        # ----------------------------------------------------

        if not file:
            raise ValueError("Resume file is required")

        filename = file.filename or "resume.pdf"

        if not filename.lower().endswith(".pdf"):
            raise ValueError(
                "Only PDF resumes are supported"
            )

        # ----------------------------------------------------
        # 2. Create safe temporary file
        # ----------------------------------------------------

        file_id = str(uuid.uuid4())

        safe_filename = os.path.basename(
            filename
        )

        file_path = os.path.join(
            UPLOAD_DIR,
            f"{file_id}_{safe_filename}"
        )

        try:

            # =================================================
            # 3. SAVE PDF TEMPORARILY
            # =================================================

            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            # =================================================
            # 4. EXTRACT COMPLETE RESUME TEXT
            # =================================================

            text = extract_text_from_pdf(
                file_path
            )

            if not text or not text.strip():
                raise ValueError(
                    "Could not extract readable text "
                    "from the resume"
                )

            # Clean surrounding whitespace only.
            # Do NOT destroy the original resume content
            # because Qwen will use this later.
            resume_text = text.strip()

            # =================================================
            # 5. ORIGINAL PYTHON RESUME ANALYZER
            #
            # This remains responsible for:
            #
            # ATS Score
            # Detected Skills
            #
            # Qwen is intentionally NOT called here.
            # =================================================

            analysis = analyze_resume(
                resume_text
            )

            # -------------------------------------------------
            # ATS Score
            # -------------------------------------------------

            ats_score = analysis.get(
                "score",
                0
            )

            try:
                ats_score = int(
                    round(float(ats_score))
                )
            except (TypeError, ValueError):
                ats_score = 0

            # Keep score inside valid percentage range
            ats_score = max(
                0,
                min(100, ats_score)
            )

            # -------------------------------------------------
            # Detected Skills
            # -------------------------------------------------

            detected_skills = analysis.get(
                "skills",
                []
            )

            if not isinstance(
                detected_skills,
                list
            ):
                detected_skills = []

            # Remove empty/duplicate skills while
            # preserving their original order.
            clean_skills = []

            seen_skills = set()

            for skill in detected_skills:

                skill_text = str(
                    skill
                ).strip()

                if not skill_text:
                    continue

                skill_key = (
                    skill_text.lower()
                )

                if skill_key in seen_skills:
                    continue

                seen_skills.add(
                    skill_key
                )

                clean_skills.append(
                    skill_text
                )

            # =================================================
            # 6. SELECTED DOMAIN
            # =================================================

            selected_domain = str(
                role or ""
            ).strip()

            # =================================================
            # 7. RETURN ROUND 1 IMMEDIATE RESULT
            #
            # IMPORTANT:
            #
            # We return immediately after Python analysis.
            #
            # This restores the intended Round 1 behavior:
            #
            # Upload PDF
            #    ↓
            # ATS Score
            #    ↓
            # Detected Skills
            #    ↓
            # Show result on SAME Round 1 page
            #    ↓
            # User clicks Continue to Round 2
            #
            # Qwen3:4b will be used later for detailed
            # Round 1 feedback.
            # =================================================

            return {

                # Immediate Round 1 result
                "score": ats_score,

                "skills": clean_skills,

                # Save this through the controller.
                # It will later be sent to Qwen for
                # detailed Round 1 feedback.
                "resume_text": resume_text,

                # User's selected interview/domain
                "selected_domain": selected_domain,
            }

        finally:

            # =================================================
            # 8. DELETE TEMPORARY PDF
            # =================================================

            if os.path.exists(
                file_path
            ):
                try:
                    os.remove(
                        file_path
                    )
                except OSError:
                    pass