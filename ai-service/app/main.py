import logging
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.core.lifespan import lifespan
from app.core.logging import setup_logging
from app.core.exceptions import register_exception_handlers
from app.api.v1.router import api_router
from app.api.v1.endpoints import health

# Cấu hình Structured Logging theo Mục 7.2 convention-ai.md
setup_logging()
logger = logging.getLogger("ai_service.main")

def _get_internal_secret() -> str:
    """Lấy internal secret động từ env hoặc settings để hỗ trợ test."""
    return (
        os.environ.get("INTERNAL_SECRET", "")
        or getattr(settings, "INTERNAL_SECRET", "")
    )


class InternalSecretMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Exclude documentation and health-check endpoints from middleware check
        path = request.url.path
        if path in ("/health", "/ping", "/docs", "/redoc", "/openapi.json", "/swagger", "/swagger-ui.html"):
            return await call_next(request)
        internal_secret = _get_internal_secret()
        # Nếu không cấu hình secret, bỏ qua kiểm tra (dev/test local)
        if not internal_secret:
            return await call_next(request)
        secret = request.headers.get("X-Internal-Secret", "")
        if secret != internal_secret:
            return JSONResponse(
                status_code=403,
                content={"detail": "Forbidden: missing or invalid X-Internal-Secret"},
            )
        return await call_next(request)


# Khởi tạo FastAPI với Swagger UI (/docs và /swagger-ui.html)
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Dedicated AI Microservice for EnglishHub - Autonomous Speaking & Writing Evaluation Engine.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    swagger_ui_parameters={
        "persistAuthorization": True,
        "displayRequestDuration": True,
        "tryItOutEnabled": True,
        "docExpansion": "list",
    },
    lifespan=lifespan
)


def custom_openapi():
    """Tự động tích hợp nút Authorize vào giao diện Swagger UI cho X-Internal-Secret."""
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    openapi_schema["components"] = openapi_schema.get("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "InternalSecretAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-Internal-Secret",
            "description": "Internal Secret Key for microservice authentication (để trống nếu chạy local không set INTERNAL_SECRET)."
        }
    }
    openapi_schema["security"] = [{"InternalSecretAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi


@app.get("/swagger-ui.html", include_in_schema=False)
@app.get("/swagger", include_in_schema=False)
async def swagger_ui_redirect():
    """Hỗ trợ đường dẫn quen thuộc /swagger-ui.html tương tự như Spring Boot."""
    return RedirectResponse(url="/docs")

# Đăng ký Global Exception Handlers theo Mục 7.1 convention-ai.md
register_exception_handlers(app)

# Internal Secret Middleware (must be added before other middlewares that might interfere)
app.add_middleware(InternalSecretMiddleware)

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
