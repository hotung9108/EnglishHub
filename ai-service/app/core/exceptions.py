import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.schemas.common import ErrorDetail, ErrorResponse

logger = logging.getLogger("ai_service.exceptions")


class AIServiceException(Exception):
    """Lớp Exception cơ sở cho toàn bộ domain AI Service."""
    def __init__(
        self,
        message: str,
        code: str = "AI_SERVICE_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        errors: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.errors = errors or []


class AudioProcessingException(AIServiceException):
    """Lỗi xử lý file âm thanh (FFmpeg, validation, decoding)."""
    def __init__(self, message: str, code: str = "AUDIO_PROCESSING_ERROR", errors: Optional[List[ErrorDetail]] = None):
        super().__init__(
            message=message,
            code=code,
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=errors
        )


class LLMProviderException(AIServiceException):
    """Lỗi khi gọi hoặc xử lý kết quả từ các provider LLM (Gemini / OpenRouter)."""
    def __init__(self, message: str, code: str = "LLM_PROVIDER_ERROR", status_code: int = status.HTTP_502_BAD_GATEWAY):
        super().__init__(message=message, code=code, status_code=status_code)


class PromptInjectionException(AIServiceException):
    """Lỗi phát hiện hành vi tấn công prompt injection qua nội dung nộp bài."""
    def __init__(self, message: str = "Nội dung chứa cấu trúc không hợp lệ"):
        super().__init__(
            message=message,
            code="PROMPT_INJECTION_DETECTED",
            status_code=status.HTTP_400_BAD_REQUEST
        )


def register_exception_handlers(app: FastAPI):
    """
    Đăng ký Global Exception Handlers đảm bảo mọi lỗi trả về client
    luôn bọc trong Envelope chuẩn theo Mục 7.1 convention-ai.md.
    """

    @app.exception_handler(AIServiceException)
    async def ai_service_exception_handler(request: Request, exc: AIServiceException):
        logger.error("AIServiceException [%s]: %s", exc.code, exc.message)
        payload = ErrorResponse(
            success=False,
            code=exc.code,
            message=exc.message,
            errors=exc.errors
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=payload.model_dump(by_alias=True)
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        # Xác định error code tương ứng status code
        code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_400_BAD_REQUEST:
            code = "BAD_REQUEST"
        elif exc.status_code == status.HTTP_404_NOT_FOUND:
            code = "NOT_FOUND"
        elif exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            code = "INTERNAL_SERVER_ERROR"

        detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        payload = ErrorResponse(
            success=False,
            code=code,
            message=detail_msg
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=payload.model_dump(by_alias=True)
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        field_errors = []
        for err in exc.errors():
            loc = " -> ".join([str(p) for p in err.get("loc", []) if p != "body"])
            msg = err.get("msg", "Validation error")
            field_errors.append(ErrorDetail(field=loc or None, message=msg))

        payload = ErrorResponse(
            success=False,
            code="VALIDATION_ERROR",
            message="Dữ liệu yêu cầu không hợp lệ.",
            errors=field_errors
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=payload.model_dump(by_alias=True)
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.critical("Unhandled Exception at %s: %s", request.url.path, str(exc), exc_info=True)
        payload = ErrorResponse(
            success=False,
            code="INTERNAL_SERVER_ERROR",
            message="Đã xảy ra lỗi hệ thống bất ngờ. Vui lòng liên hệ quản trị viên."
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=payload.model_dump(by_alias=True)
        )
