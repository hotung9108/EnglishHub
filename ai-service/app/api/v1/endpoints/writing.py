import re
import logging
from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import Optional
from app.schemas.writing import AnalyzeWritingRequest, AnalyzeWritingResponse
from app.services.gemini_service import GeminiService
from app.services.text_analyzer import TextAnalyzer

logger = logging.getLogger("ai_service.api.writing")
router = APIRouter()


@router.post(
    "/analyze/writing",
    response_model=AnalyzeWritingResponse,
    status_code=status.HTTP_200_OK,
    summary="Phân tích và chấm điểm bài tập Viết (Writing) qua AI",
    description="Nhận nội dung bài viết dạng JSON text, tính toán các chỉ số ngôn ngữ học (TTR, Flesch-Kincaid), đánh giá 4 tiêu chí IELTS/CEFR và sinh danh sách lỗi dạng offset."
)
async def analyze_writing(request: AnalyzeWritingRequest) -> AnalyzeWritingResponse:
    logger.info("Received analyze writing request for submissionModuleId: %s", request.submissionModuleId)

    content = request.content.strip() if request.content else ""
    if not content:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nội dung bài viết không được để trống."
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


@router.post(
    "/analyze/writing/upload",
    response_model=AnalyzeWritingResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload trực tiếp file tài liệu (.txt, .docx, .pdf, .md) để chấm điểm Viết",
    description="Nhận file tài liệu trực tiếp từ máy tính qua multipart/form-data, tự động trích xuất nội dung văn bản và chạy pipeline chấm điểm. Rất thuận tiện để test trực tiếp trên Swagger UI hoặc Postman."
)
async def analyze_writing_upload(
    file: UploadFile = File(..., description="File bài viết (.txt, .docx, .pdf, .md)"),
    submission_module_id: int = Form(1, alias="submissionModuleId"),
    module_instructions: Optional[str] = Form(None, alias="moduleInstructions"),
    ai_instruction_snapshot: Optional[str] = Form(None, alias="aiInstructionSnapshot"),
    max_score: float = Form(9.0, alias="maxScore"),
    model: Optional[str] = Form(None, alias="model", description="Tùy chọn ghi đè model AI"),
    ai_provider: Optional[str] = Form(None, alias="aiProvider", description="Provider tùy chọn ('openrouter' | 'gemini')")
) -> AnalyzeWritingResponse:
    logger.info("Received document upload: %s (model: %s, provider: %s)", file.filename, model or "default", ai_provider or "default")

    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tệp tải lên rỗng (0 bytes)."
            )

        # 1. Trích xuất text từ tệp tài liệu
        try:
            content = TextAnalyzer.extract_text_from_document(file_bytes, file.filename or "essay.txt")
        except ValueError as val_err:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(val_err)
            )

        if not content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Không thể trích xuất nội dung văn bản từ tệp hoặc tệp không chứa chữ."
            )

        # 2. Kiểm tra độ dài tối thiểu (Word Count Gate >= 20 words)
        words = re.findall(r"\b[A-Za-z0-9'-]+\b", content)
        if len(words) < 20:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Nội dung trong tài liệu quá ngắn ({len(words)} từ). Yêu cầu tối thiểu 20 từ để có thể đánh giá học thuật."
            )

        # 3. Chạy pipeline chấm điểm
        result = await GeminiService.analyze_writing(
            submission_module_id=submission_module_id,
            content=content,
            module_instructions=module_instructions,
            ai_instruction_snapshot=ai_instruction_snapshot,
            max_score=max_score,
            custom_model=model,
            custom_provider=ai_provider
        )

        logger.info(
            "Successfully completed uploaded writing analysis for %s with score: %s",
            file.filename,
            result.overallScore
        )
        return result

    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        logger.error("Error analyzing uploaded document %s: %s", file.filename, str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xử lý tệp tài liệu: {str(exc)}"
        )
