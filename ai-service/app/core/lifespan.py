import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings

logger = logging.getLogger("ai_service.lifespan")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager quản lý startup và shutdown của AI Service.
    Thay thế hoàn toàn cơ chế cũ @app.on_event theo Mục 3.3 convention-ai.md.
    """
    openrouter_configured = bool(settings.OPENROUTER_API_KEY.strip())
    gemini_configured = bool(settings.GEMINI_API_KEY.strip())
    mock_mode = settings.MOCK_MODE or (not openrouter_configured and not gemini_configured)

    logger.info("==================================================")
    logger.info("Starting %s v%s", settings.APP_NAME, settings.APP_VERSION)
    logger.info("Gemini Model: %s (configured: %s)", settings.GEMINI_MODEL, gemini_configured)
    logger.info("OpenRouter Model: %s (configured: %s)", settings.OPENROUTER_MODEL, openrouter_configured)
    logger.info("AI Provider Strategy: %s", settings.AI_PROVIDER)
    logger.info("Mock / QA-21 Benchmark Mode: %s", mock_mode)
    logger.info("==================================================")
    
    yield
    
    logger.info("Cleaning up AI Service resources & shutting down %s...", settings.APP_NAME)
