from fastapi import APIRouter
from app.api.v1.endpoints import health, speaking, writing

api_router = APIRouter()

# Đăng ký các endpoints chuyên biệt cho API v1
api_router.include_router(health.router, prefix="", tags=["Health"])
api_router.include_router(speaking.router, prefix="", tags=["Speaking Analysis"])
api_router.include_router(writing.router, prefix="", tags=["Writing Analysis"])
