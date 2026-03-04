from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    ocr_router,
    domain_router,
    insights_router,
    risk_router,
    suggestions_router,
    vector_router,
    goal_router
)

# ==============================
# FASTAPI APP
# ==============================

app = FastAPI(
    title="SmartReportAI Backend",
    description="AI-powered report analysis system",
    version="1.0.0"
)

# ==============================
# CORS CONFIGURATION
# ==============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# ROOT ENDPOINT
# ==============================

@app.get("/")
def root():
    return {
        "message": "SmartReportAI Backend is running 🚀"
    }

# ==============================
# HEALTH CHECK (for deployment)
# ==============================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }

# ==============================
# INCLUDE ROUTERS
# ==============================

app.include_router(ocr_router.router)
app.include_router(domain_router.router)
app.include_router(insights_router.router)
app.include_router(risk_router.router)
app.include_router(suggestions_router.router)
app.include_router(vector_router.router)
app.include_router(goal_router.router)