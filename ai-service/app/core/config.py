import os
from pathlib import Path
from typing import List, Union

# Automatically load environment variables from ai-service/.env or root .env
try:
    from dotenv import load_dotenv
    ai_service_dir = Path(__file__).resolve().parent.parent.parent  # ai-service/
    root_dir = ai_service_dir.parent  # EnglishHub/
    if (ai_service_dir / ".env").exists():
        load_dotenv(ai_service_dir / ".env")
    elif (root_dir / ".env").exists():
        load_dotenv(root_dir / ".env")
except ImportError:
    pass

try:
    from pydantic import field_validator
    from pydantic_settings import BaseSettings, SettingsConfigDict
    class Settings(BaseSettings):
        APP_NAME: str = "EnglishHub AI Service"
        APP_VERSION: str = "1.0.0"
        API_V1_PREFIX: str = "/api/v1"
        PORT: int = 8001
        
        # AI Provider strategy: "auto", "openrouter", "gemini"
        AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openrouter")

        # OpenRouter Configuration (Unified multi-model API)
        OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
        OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

        # Google Gemini Direct Configuration
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        # Mock / Test Mode: True enables deterministic benchmark responses for QA-21
        MOCK_MODE: bool = os.getenv("MOCK_MODE", "false").lower() in ("true", "1")
        
        # Network & Timeout settings
        REQUEST_TIMEOUT_SECONDS: int = 60
        MAX_RETRIES: int = 2
        
        # CORS
        CORS_ALLOWED_ORIGINS: Union[str, List[str]] = ["*"]

        @field_validator("CORS_ALLOWED_ORIGINS", mode="after")
        @classmethod
        def parse_cors_allowed_origins(cls, v: Union[str, List[str]]) -> List[str]:
            if isinstance(v, str):
                v = v.strip()
                if v.startswith("[") and v.endswith("]"):
                    import json
                    try:
                        return json.loads(v)
                    except Exception:
                        pass
                return [origin.strip() for origin in v.split(",") if origin.strip()]
            return v

        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            case_sensitive=True,
            extra="ignore"
        )
except ImportError:
    from pydantic import BaseModel
    class Settings(BaseModel):
        APP_NAME: str = os.getenv("APP_NAME", "EnglishHub AI Service")
        APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
        API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
        PORT: int = int(os.getenv("PORT", "8001"))
        
        # AI Provider strategy: "auto", "openrouter", "gemini"
        AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openrouter")

        # OpenRouter Configuration
        OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
        OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

        # Google Gemini Direct Configuration
        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        # Mock / Test Mode: True enables deterministic benchmark responses for QA-21
        MOCK_MODE: bool = os.getenv("MOCK_MODE", "false").lower() in ("true", "1")
        
        # Network & Timeout settings
        REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "60"))
        MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "2"))
        
        # CORS
        CORS_ALLOWED_ORIGINS: List[str] = ["*"]


settings = Settings()
