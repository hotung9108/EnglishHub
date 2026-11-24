import re
import logging
from urllib.parse import urlparse
import httpx
from fastapi import APIRouter, HTTPException, status
from app.core.config import settings
from app.core.exceptions import AIServiceException
from app.schemas.writing import AnalyzeWritingRequest, AnalyzeWritingResponse
from app.services.gemini_service import GeminiService
from app.services.text_analyzer import TextAnalyzer

logger = logging.getLogger("ai_service.api.writing")
router = APIRouter()

STORAGE_TIMEOUT_SECONDS = 30.0
MAX_DOCUMENT_BYTES = 10 * 1024 * 1024


class DocumentTooLargeException(AIServiceException):
    def __init__(self) -> None:
        super().__init__(
            message="Dung lượng tài liệu vượt quá giới hạn 10 MiB.",
            code="DOCUMENT_TOO_LARGE",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )


async def _download_document(document_url: str) -> bytes:
    """Tải tệp tài liệu từ Presigned URL."""
    async with httpx.AsyncClient(timeout=STORAGE_TIMEOUT_SECONDS, follow_redirects=True) as client:
        try:
            async with client.stream("GET", document_url) as response:
                if response.status_code != status.HTTP_200_OK:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Không thể tải tài liệu bài viết từ URL. Mã phản hồi: {response.status_code}",
                    )

                content_encoding = response.headers.get("Content-Encoding")
                if content_encoding is None or content_encoding.strip().lower() == "identity":
                    try:
                        content_length = int(response.headers.get("Content-Length", ""))
                    except ValueError:
                        content_length = 0
                    if content_length > MAX_DOCUMENT_BYTES:
                        raise DocumentTooLargeException()

                document = bytearray()
                total_bytes = 0
                async for chunk in response.aiter_bytes():
                    total_bytes += len(chunk)
                    if total_bytes > MAX_DOCUMENT_BYTES:
                        raise DocumentTooLargeException()
                    document.extend(chunk)
                return bytes(document)
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Lỗi kết nối khi tải tài liệu từ storage: {str(exc)}",
            ) from exc


@router.post(
    "/analyze/writing",
    response_model=AnalyzeWritingResponse,
    status_code=status.HTTP_200_OK,
    summary="Phân tích và chấm điểm bài tập Viết (Writing) qua AI",
    description="Nhận nội dung bài viết dạng JSON text hoặc Presigned URL tải file tài liệu (.txt, .docx, .pdf, .md), tính toán chỉ số ngôn ngữ, đánh giá 4 tiêu chí IELTS/CEFR và sinh danh sách lỗi."
)
async def analyze_writing(request: AnalyzeWritingRequest) -> AnalyzeWritingResponse:
    logger.info("Received analyze writing request for submissionModuleId: %s", request.submissionModuleId)

    content = request.content.strip() if request.content else ""
    doc_url = request.documentUrl or request.document_url

    if not content and doc_url:
        parsed_document = False
        logger.info("Downloading document from Presigned URL for submissionModuleId %s", request.submissionModuleId)
        try:
            doc_bytes = await _download_document(doc_url)
            if not doc_bytes:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tệp tài liệu tải về rỗng (0 bytes)."
                )
            parsed_path = urlparse(doc_url).path
            filename = parsed_path.split("/")[-1] if "/" in parsed_path else "document.txt"
            if not filename or "." not in filename:
                filename = "document.txt"
            document_type = filename.lower().rsplit(".", 1)[-1]
            is_pdf_or_docx = document_type in ("pdf", "docx")

            try:
                content = TextAnalyzer.extract_text_from_document(doc_bytes, filename)
                parsed_document = is_pdf_or_docx
            except ValueError as val_err:
                if is_pdf_or_docx:
                    root_cause = val_err
                    while root_cause.__cause__ or root_cause.__context__:
                        root_cause = root_cause.__cause__ or root_cause.__context__
                    logger.warning(
                        "Document parser failed: submissionModuleId=%s, fileType=%s, cause=%s",
                        request.submissionModuleId,
                        document_type,
                        type(root_cause).__name__,
                    )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(val_err)
                )
        except DocumentTooLargeException:
            raise
        except Exception as dl_err:
            if settings.MOCK_MODE or (request.aiProvider and request.aiProvider.lower() == "mock"):
                content = "Mock writing submission content for testing and benchmarking requirements with sufficient words."
            else:
                raise dl_err

        if parsed_document and not content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không trích xuất được văn bản từ tệp PDF/DOCX."
            )

    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nội dung bài viết không được để trống (cần cung cấp content hoặc documentUrl)."
        )

    # Kiểm tra độ dài tối thiểu (Word Count Gate >= 20 words)
    words = re.findall(r"\b[A-Za-z0-9'-]+\b", content)
    if len(words) < 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Bài viết quá ngắn ({len(words)} từ). Yêu cầu tối thiểu 20 từ để có thể đánh giá học thuật."
        )

    try:
        result = await GeminiService.analyze_writing(
            submission_module_id=request.submissionModuleId,
            content=content,
            module_instructions=request.moduleInstructions,
            ai_instruction_snapshot=request.aiInstructionSnapshot,
            max_score=request.maxScore,
            custom_model=request.model,
            custom_provider=request.aiProvider
        )

        logger.info(
            "Successfully completed writing analysis for submissionModuleId: %s with score: %s (model: %s, provider: %s)",
            request.submissionModuleId,
            result.overallScore,
            result.modelUsed,
            result.providerUsed
        )
        return result

    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        logger.error(
            "Unexpected error analyzing writing for submissionModuleId %s: %s",
            request.submissionModuleId,
            str(exc),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi nội bộ khi xử lý phân tích bài viết: {str(exc)}"
        )
