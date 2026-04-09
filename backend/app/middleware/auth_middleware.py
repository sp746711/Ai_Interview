from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from backend.app.logs.logger import get_logger

logger = get_logger(__name__)

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f"Incoming Request: {request.method} {request.url.path}")
        response = await call_next(request)
        return response

