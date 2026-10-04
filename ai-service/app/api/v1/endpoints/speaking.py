from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from typing import Optional
import logging
from app.schemas.speaking import AnalyzeSpeakingRequest, AnalyzeSpeakingResponse
from app.services.audio_processor import AudioProcessor
from app.services.gemini_service import GeminiService

logger = logging.getLogger("ai_service.api.speaking")
router = APIRouter()


@router.post(
    "/analyze/speaking",
    response_model=AnalyzeSpeakingResponse,
    status_code=status.HTTP_200_OK,
    summary="Phân tích và chấm điểm bài tập Nói (Speaking) qua AI",
    description="Nhận file ghi âm âm thanh, trích xuất transcript có timestamps, tính WPM/pauses, chấm điểm 4 tiêu chí IELTS/CEFR và sinh danh sách lỗi."
)
async def analyze_speaking(request: AnalyzeSpeakingRequest) -> AnalyzeSpeakingResponse:
    logger.info("Received analyze speaking request for submissionModuleId: %s", request.submissionModuleId)

    try:
        # 1. Ingest audio bytes from audioUrl or audioBase64
        audio_bytes, mime_type = await AudioProcessor.get_audio_bytes(
            audio_url=request.audioUrl,
            audio_base64=request.audioBase64
        )

        # 2. Run Gemini multimodal evaluation pipeline
        result = await GeminiService.analyze_speaking(
            submission_module_id=request.submissionModuleId,
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            module_instructions=request.moduleInstructions,
            ai_instruction_snapshot=request.aiInstructionSnapshot,
            max_score=request.maxScore
        )

        logger.info(
            "Successfully completed speaking analysis for submissionModuleId: %s with score: %s",
            request.submissionModuleId,
            result.overallScore
        )
        return result

    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        logger.error(
            "Unexpected error analyzing speaking for submissionModuleId %s: %s",
            request.submissionModuleId,
            str(exc),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi nội bộ khi xử lý phân tích bài nói: {str(exc)}"
        )


@router.post(
    "/analyze/speaking/upload",
    response_model=AnalyzeSpeakingResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload trực tiếp file âm thanh (MP3/WAV/M4A/WEBM) để chấm điểm Nói",
    description="Nhận file audio trực tiếp từ máy tính qua multipart/form-data. Phù hợp nhất để test trên Swagger UI hoặc cURL."
)
async def analyze_speaking_upload(
    file: UploadFile = File(..., description="File âm thanh cần chấm (mp3, wav, m4a, webm)"),
    submission_module_id: int = Form(1, alias="submissionModuleId"),
    module_instructions: Optional[str] = Form(None, alias="moduleInstructions"),
    ai_instruction_snapshot: Optional[str] = Form(None, alias="aiInstructionSnapshot"),
    max_score: float = Form(9.0, alias="maxScore")
) -> AnalyzeSpeakingResponse:
    logger.info("Received direct audio upload: %s (content_type: %s)", file.filename, file.content_type)
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File âm thanh rỗng (0 bytes)."
            )

        mime_type = file.content_type or "audio/mp3"

        result = await GeminiService.analyze_speaking(
            submission_module_id=submission_module_id,
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            module_instructions=module_instructions,
            ai_instruction_snapshot=ai_instruction_snapshot,
            max_score=max_score
        )
        return result

    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        logger.error("Error analyzing uploaded audio: %s", str(exc), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi xử lý file âm thanh: {str(exc)}"
        )

