import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import api_router
from app.api.v1.endpoints import health

# Cấu hình Structured Logging theo Mục 7.2 convention-ai.md
setup_logging()
logger = logging.getLogger("ai_service.main")

# Khởi tạo FastAPI với Lifespan Context Manager theo Mục 3.3 convention-ai.md
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Dedicated AI Microservice for EnglishHub - Autonomous Speaking & Writing Evaluation Engine.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Đăng ký Global Exception Handlers theo Mục 7.1 convention-ai.md
register_exception_handlers(app)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health Check (dành cho Docker Container Healthcheck probe)
app.include_router(health.router, prefix="", tags=["Health"])

# API v1 Router (Speaking & Writing)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
