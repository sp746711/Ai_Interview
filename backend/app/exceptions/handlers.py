from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from backend.app.logs.logger import get_logger

logger = get_logger(__name__)

class ContentException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

def add_exception_handlers(app: FastAPI):
    @app.exception_handler(ContentException)
    async def custom_exception_handler(request: Request, exc: ContentException):
        logger.error(f"Error {exc.status_code}: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": exc.message},
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled Exception: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": "Internal server error"},
        )

