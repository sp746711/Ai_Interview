import fitz
from backend.app.logs.logger import get_logger

logger = get_logger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    try:
        text = ""

        with fitz.open(file_path) as doc:
            for page_number, page in enumerate(doc, start=1):
                page_text = page.get_text("text")

                text += f"\n--- PAGE {page_number} ---\n"
                text += page_text
                text += "\n"

        return text.strip()

    except Exception as e:
        logger.error(f"Error parsing PDF {file_path}: {str(e)}")
        raise