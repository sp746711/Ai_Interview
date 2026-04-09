from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.routes import auth_routes, interview_routes, test_routes, ai_routes
from app.exceptions.handlers import add_exception_handlers
from app.middleware.auth_middleware import AuthMiddleware

app = FastAPI(
    title="AI Mock Interview Platform",
    description="Backend API for AI Mock Interview Platform",
    version="1.0.0"
)

# Middleware
app.add_middleware(AuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
add_exception_handlers(app)

# Database events
@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Routers
app.include_router(auth_routes.router)
app.include_router(interview_routes.router)
app.include_router(test_routes.router)
app.include_router(ai_routes.router)

@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "AI Mock Interview Platform Backend is running"}
