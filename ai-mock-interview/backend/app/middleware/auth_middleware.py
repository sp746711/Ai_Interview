"""
Authentication middleware
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.security import decode_token

class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for token authentication"""
    
    async def dispatch(self, request: Request, call_next):
        """Process request and validate token"""
        # Skip authentication for public routes
        public_routes = ["/api/auth/register", "/api/auth/login", "/health"]
        
        if request.url.path in public_routes:
            return await call_next(request)
        
        # Extract token from headers
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid token")
        
        token = auth_header.split(" ")[1]
        payload = decode_token(token)
        
        if not payload:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        request.state.user_id = payload.get("sub")
        return await call_next(request)
