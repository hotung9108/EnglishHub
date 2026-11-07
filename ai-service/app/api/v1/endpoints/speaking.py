from fastapi import APIRouter, HTTPException, status
import logging
from app.core.config import settings
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
    description="Nhận Presigned URL tệp âm thanh, tự tải về, trích xuất transcript có timestamps, tính WPM/pauses, chấm điểm 4 tiêu chí IELTS/CEFR và sinh danh sách lỗi."
)
async def analyze_speaking(request: AnalyzeSpeakingRequest) -> AnalyzeSpeakingResponse:
    logger.info("Received analyze speaking request for submissionModuleId: %s", request.submissionModuleId)

    try:
        # 1. Ingest audio bytes from presigned audioUrl
        try:
            audio_bytes, mime_type = await AudioProcessor.get_audio_bytes(
                audio_url=request.audioUrl
            )
        except Exception as ingest_err:
            if (settings.MOCK_MODE or (request.aiProvider and request.aiProvider.lower() == "mock")) and request.audioUrl:
                audio_bytes, mime_type = b"", "audio/wav"
            else:
                raise ingest_err

        # 2. Run Gemini multimodal evaluation pipeline
        result = await GeminiService.analyze_speaking(
            submission_module_id=request.submissionModuleId,
            audio_bytes=audio_bytes,
            mime_type=mime_type,
            module_instructions=request.moduleInstructions,
            ai_instruction_snapshot=request.aiInstructionSnapshot,
            max_score=request.maxScore,
            custom_model=request.model,
            custom_provider=request.aiProvider
        )

        logger.info(
            "Successfully completed speaking analysis for submissionModuleId: %s with score: %s (model: %s, provider: %s)",
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
            "Unexpected error analyzing speaking for submissionModuleId %s: %s",
            request.submissionModuleId,
            str(exc),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi nội bộ khi xử lý phân tích bài nói: {str(exc)}"
        )

