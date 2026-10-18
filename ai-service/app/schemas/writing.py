from typing import List, Optional
from pydantic import Field
from app.schemas.base import CamelModel


class WritingMetrics(CamelModel):
    word_count: int = Field(..., description="Tổng số từ trong bài viết")
    sentence_count: int = Field(..., description="Tổng số câu trong bài viết")
    average_sentence_length: float = Field(..., description="Số từ trung bình trên mỗi câu")
    lexical_diversity: float = Field(..., description="Tỷ lệ đa dạng từ vựng Type-Token Ratio (TTR)")
    flesch_kincaid_grade: float = Field(..., description="Chỉ số độ phức tạp câu Flesch-Kincaid Grade Level")


class WritingCriteriaScores(CamelModel):
    task_response: float = Field(..., description="Điểm tiêu chí Task Response / Task Achievement (0 - maxScore)")
    coherence_and_cohesion: float = Field(..., description="Điểm tiêu chí Coherence and Cohesion (0 - maxScore)")
    lexical_resource: float = Field(..., description="Điểm tiêu chí Lexical Resource (0 - maxScore)")
    grammatical_range_and_accuracy: float = Field(..., description="Điểm tiêu chí Grammatical Range and Accuracy (0 - maxScore)")
    overall_score: float = Field(..., description="Điểm tổng thể đề xuất (0 - maxScore)")


class WritingAnnotationItem(CamelModel):
    start_offset: int = Field(..., description="Vị trí ký tự bắt đầu của lỗi trong bài viết gốc")
    end_offset: int = Field(..., description="Vị trí ký tự kết thúc của lỗi trong bài viết gốc")
    error_type: str = Field(..., description="Loại lỗi (GRAMMAR, VOCABULARY, COHESION, PUNCTUATION, SPELLING)")
    comment: str = Field(..., description="Nhận xét / giải thích lỗi")
    suggested_fix: Optional[str] = Field(None, description="Gợi ý sửa lỗi")


class AnalyzeWritingRequest(CamelModel):
    submission_module_id: int = Field(..., description="ID phần nộp bài")
    content: str = Field(..., description="Nội dung bài viết học viên nộp")
    module_instructions: Optional[str] = Field(None, description="Đề bài hoặc yêu cầu câu hỏi")
    ai_instruction_snapshot: Optional[str] = Field(None, description="Tiêu chí chấm hoặc rubric tùy chỉnh")
    max_score: float = Field(9.0, description="Thang điểm tối đa")
    model: Optional[str] = Field(None, description="Tùy chọn ghi đè model AI")
    ai_provider: Optional[str] = Field(None, description="Tùy chọn ghi đè provider ('gemini' hoặc 'openrouter')")


class AnalyzeWritingResponse(CamelModel):
    submission_module_id: int
    overall_score: float
    ai_feedback: str
    text_metrics: WritingMetrics
    criteria_scores: WritingCriteriaScores
    annotations: List[WritingAnnotationItem] = Field(default_factory=list)
    model_used: str
    provider_used: str
