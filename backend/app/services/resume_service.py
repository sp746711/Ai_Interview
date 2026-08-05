import os
import shutil
import uuid

from fastapi import UploadFile

from backend.app.utils.pdf_parser import extract_text_from_pdf
from backend.app.utils.text_cleaner import analyze_resume


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ResumeService:

    @staticmethod
    async def process_resume(file: UploadFile, role: str) -> dict:

        if not file:
            raise ValueError("Resume file is required")

        filename = file.filename or "resume.pdf"

        if not filename.lower().endswith(".pdf"):
            raise ValueError("Only PDF resumes are supported")

        file_id = str(uuid.uuid4())

        safe_filename = os.path.basename(filename)

        file_path = os.path.join(
            UPLOAD_DIR,
            f"{file_id}_{safe_filename}"
        )

        try:
            # Save uploaded resume temporarily
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Extract complete resume text
            text = extract_text_from_pdf(file_path)

            if not text or not text.strip():
                raise ValueError(
                    "Could not extract readable text from the resume"
                )

            # Analyze actual resume content
            analysis = analyze_resume(text)

            return {
                "score": analysis["score"],
                "skills": analysis["skills"]
            }

        finally:
            # Remove temporary uploaded file
            if os.path.exists(file_path):
                os.remove(file_path)