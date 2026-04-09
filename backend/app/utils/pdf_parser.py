import fitz  # PyMuPDF
from app.logs.logger import get_logger

logger = get_logger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    try:
        text = ""
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        logger.error(f"Error parsing PDF {file_path}: {str(e)}")
        raise e
