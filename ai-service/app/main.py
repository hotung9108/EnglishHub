import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import health, speaking, writing

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("ai_service.main")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Dedicated AI Microservice for EnglishHub - Autonomous Speaking & Writing Evaluation Engine.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router, prefix="", tags=["Health"])
app.include_router(speaking.router, prefix=settings.API_V1_PREFIX, tags=["Speaking Analysis"])
app.include_router(writing.router, prefix=settings.API_V1_PREFIX, tags=["Writing Analysis"])


@app.on_event("startup")
async def startup_event():
    logger.info("==================================================")
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    logger.info("Gemini Model: %s", settings.GEMINI_MODEL)
    logger.info("Mock / Benchmark Mode: %s", settings.MOCK_MODE or not bool(settings.GEMINI_API_KEY))
    logger.info("==================================================")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down %s", settings.APP_NAME)
