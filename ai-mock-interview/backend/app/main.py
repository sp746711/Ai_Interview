"""
FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routes import auth_routes, interview_routes, test_routes, ai_routes

app = FastAPI(
    title="AI Mock Interview",
    description="AI-powered mock interview platform",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["auth"])
app.include_router(interview_routes.router, prefix="/api/interviews", tags=["interviews"])
app.include_router(test_routes.router, prefix="/api/tests", tags=["tests"])
app.include_router(ai_routes.router, prefix="/api/ai", tags=["ai"])

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
