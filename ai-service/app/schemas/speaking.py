from typing import List, Optional
from pydantic import Field
from app.schemas.base import CamelModel


class WordTimestamp(CamelModel):
    word: str
    start: float
    end: float
    confidence: float = 0.95


class FluencyMetrics(CamelModel):
    words_per_minute: float
    pause_count: int
    total_duration_seconds: float
    phonation_time_ratio: float


class CriteriaScores(CamelModel):
    fluency_and_coherence: float
    lexical_resource: float
    grammatical_range_and_accuracy: float
    pronunciation: float
    overall_score: float


class AnnotationItem(CamelModel):
    start_offset: int
    end_offset: int
    error_type: str
    comment: str
    suggested_fix: Optional[str] = None


class AnalyzeSpeakingRequest(CamelModel):
    submission_module_id: int
    audio_url: Optional[str] = None
    audio_base64: Optional[str] = None
    audio_storage_key: Optional[str] = None
    module_instructions: Optional[str] = None
    ai_instruction_snapshot: Optional[str] = None
    max_score: float = 9.0
    model: Optional[str] = Field(None, description="Tùy chọn ghi đè model AI (ví dụ: google/gemini-2.5-flash, gemini-1.5-pro)")
    ai_provider: Optional[str] = Field(None, description="Tùy chọn ghi đè AI provider ('openrouter' hoặc 'gemini')")


class AnalyzeSpeakingResponse(CamelModel):
    submission_module_id: int
    overall_score: float
    ai_feedback: str
    ai_transcript: List[WordTimestamp]
    fluency_metrics: FluencyMetrics
    criteria_scores: CriteriaScores
    annotations: List[AnnotationItem] = Field(default_factory=list)
    model_used: Optional[str] = Field(None, description="Model AI thực tế đã dùng để chấm bài")
    provider_used: Optional[str] = Field(None, description="Provider AI thực tế đã phục vụ request")
