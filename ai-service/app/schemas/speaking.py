from typing import List, Optional
from pydantic import Field, ConfigDict
from pydantic.alias_generators import to_camel
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
    exact_text: Optional[str] = None
    context: Optional[str] = None
    error_type: str
    comment: str
    suggested_fix: Optional[str] = None


class AnalyzeSpeakingRequest(CamelModel):
    submission_module_id: int = Field(..., description="ID phần nộp bài")
    audio_url: Optional[str] = Field(None, description="Presigned URL để tải tệp âm thanh (.mp3, .wav, .m4a, .webm, .ogg)")
    audio_storage_key: Optional[str] = Field(None, description="Khóa lưu trữ âm thanh trên Storage")
    module_instructions: Optional[str] = Field(None, description="Đề bài hoặc yêu cầu câu hỏi")
    ai_instruction_snapshot: Optional[str] = Field(None, description="Tiêu chí chấm hoặc rubric tùy chỉnh")
    max_score: float = Field(9.0, description="Thang điểm tối đa")
    model: Optional[str] = Field(None, description="Tùy chọn ghi đè model AI (ví dụ: google/gemini-2.5-flash, gemini-1.5-pro)")
    ai_provider: Optional[str] = Field(None, description="Tùy chọn ghi đè AI provider ('openrouter', 'gemini' hoặc 'mock')")

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
        from_attributes=True,
        str_strip_whitespace=True,
        json_schema_extra={
            "examples": [
                {
                    "submissionModuleId": 14,
                    "audioUrl": "https://storage.example.com/audio/sample_speaking.mp3?presigned=true",
                    "audioStorageKey": "submissions/speaking_14.mp3",
                    "moduleInstructions": "Describe a book you enjoyed reading recently.",
                    "aiInstructionSnapshot": "Standard IELTS Speaking Part 2 Rubric",
                    "maxScore": 9.0,
                    "aiProvider": "mock"
                }
            ]
        }
    )


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
