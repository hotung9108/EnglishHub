from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check():
    openrouter_configured = bool(settings.OPENROUTER_API_KEY.strip())
    gemini_configured = bool(settings.GEMINI_API_KEY.strip())
    
    active_provider = settings.AI_PROVIDER.lower()
    if active_provider == "auto":
        active_provider = "openrouter" if openrouter_configured else ("gemini" if gemini_configured else "mock")

    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "activeProvider": active_provider,
        "openrouterConfigured": openrouter_configured,
        "openrouterModel": settings.OPENROUTER_MODEL,
        "geminiConfigured": gemini_configured,
        "geminiModel": settings.GEMINI_MODEL,
        "mockMode": settings.MOCK_MODE or (not openrouter_configured and not gemini_configured)
    }
