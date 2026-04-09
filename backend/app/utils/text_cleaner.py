import re

def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    return text.strip().lower()

def extract_skills_from_text(text: str, predefined_skills: list[str]) -> list[str]:
    found_skills = []
    clean = clean_text(text)
    words = clean.split()
    for skill in predefined_skills:
        if skill.lower() in words:
            found_skills.append(skill)
    return list(set(found_skills))
