from fastapi import UploadFile
from backend.app.utils.pdf_parser import extract_text_from_pdf
from backend.app.utils.text_cleaner import extract_skills_from_text
import shutil
import os
import uuid

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ResumeService:
    @staticmethod
    async def process_resume(file: UploadFile, role: str) -> dict:
        file_id = str(uuid.uuid4())
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        text = extract_text_from_pdf(file_path)
        
        predefined_skills = ["python", "javascript", "react", "fastapi", "django", "machine learning", "sql", "nosql", "mongodb", "docker", "aws"]
        
        skills_found = extract_skills_from_text(text, predefined_skills)
        score = len(skills_found) * 10
        
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {
            "score": min(score, 100),
            "skills": skills_found
        }

