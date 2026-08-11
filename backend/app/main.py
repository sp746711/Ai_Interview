from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db.mongodb import (
    connect_to_mongo,
    close_mongo_connection,
)

from backend.app.routes import (
    auth_routes,
    interview_routes,
    test_routes,
    ai_routes,
    dashboard_routes,
)

from backend.app.exceptions.handlers import (
    add_exception_handlers,
)

from backend.app.middleware.auth_middleware import (
    AuthMiddleware,
)


app = FastAPI(
    title="AI Mock Interview Platform",
    description="Backend API for AI Mock Interview Platform",
    version="1.0.0",
)


# =========================================================
# MIDDLEWARE
# =========================================================

# Authentication middleware is currently disabled.
# Existing authentication uses route dependencies.

# app.add_middleware(AuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# EXCEPTION HANDLERS
# =========================================================

add_exception_handlers(app)


# =========================================================
# DATABASE EVENTS
# =========================================================

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_routes.router)
app.include_router(interview_routes.router)
app.include_router(test_routes.router)
app.include_router(ai_routes.router)

# Dashboard routes — NEW
app.include_router(dashboard_routes.router)


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "message": (
            "AI Mock Interview Platform Backend "
            "is running"
        ),
    }