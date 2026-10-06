from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class CamelModel(BaseModel):
    """Base model with camelCase serialization and deserialization."""
    model_config = ConfigDict(
        populate_by_name=True,
        serialize_by_alias=True
    )


class WritingMetrics(CamelModel):
    wordCount: int = Field(..., alias="wordCount", description="Tổng số từ trong bài viết")
    sentenceCount: int = Field(..., alias="sentenceCount", description="Tổng số câu trong bài viết")
    averageSentenceLength: float = Field(..., alias="averageSentenceLength", description="Số từ trung bình trên mỗi câu")
    lexicalDiversity: float = Field(..., alias="lexicalDiversity", description="Tỷ lệ đa dạng từ vựng Type-Token Ratio (TTR)")
    fleschKincaidGrade: float = Field(..., alias="fleschKincaidGrade", description="Chỉ số độ phức tạp câu Flesch-Kincaid Grade Level")


class WritingCriteriaScores(CamelModel):
    taskResponse: float = Field(..., alias="taskResponse", description="Điểm tiêu chí Task Response / Task Achievement (0 - maxScore)")
    coherenceAndCohesion: float = Field(..., alias="coherenceAndCohesion", description="Điểm tiêu chí Coherence and Cohesion (0 - maxScore)")
    lexicalResource: float = Field(..., alias="lexicalResource", description="Điểm tiêu chí Lexical Resource (0 - maxScore)")
    grammaticalRangeAndAccuracy: float = Field(..., alias="grammaticalRangeAndAccuracy", description="Điểm tiêu chí Grammatical Range and Accuracy (0 - maxScore)")
    overallScore: float = Field(..., alias="overallScore", description="Điểm tổng thể đề xuất (0 - maxScore)")


class WritingAnnotationItem(CamelModel):
    startOffset: int = Field(..., alias="startOffset", description="Vị trí ký tự bắt đầu của lỗi trong bài viết gốc")
    endOffset: int = Field(..., alias="endOffset", description="Vị trí ký tự kết thúc của lỗi trong bài viết gốc")
    errorType: str = Field(..., alias="errorType", description="Loại lỗi (GRAMMAR, VOCABULARY, COHESION, PUNCTUATION, SPELLING)")
    comment: str = Field(..., alias="comment", description="Nhận xét / giải thích lỗi")
    suggestedFix: Optional[str] = Field(None, alias="suggestedFix", description="Gợi ý sửa lỗi")


class AnalyzeWritingRequest(CamelModel):
    submissionModuleId: int = Field(..., alias="submissionModuleId", description="ID phần nộp bài")
    content: str = Field(..., alias="content", description="Nội dung bài viết học viên nộp")
    moduleInstructions: Optional[str] = Field(None, alias="moduleInstructions", description="Đề bài hoặc yêu cầu câu hỏi")
    aiInstructionSnapshot: Optional[str] = Field(None, alias="aiInstructionSnapshot", description="Tiêu chí chấm hoặc rubric tùy chỉnh")
    maxScore: float = Field(9.0, alias="maxScore", description="Thang điểm tối đa")
    model: Optional[str] = Field(None, alias="model", description="Tùy chọn ghi đè model AI")
    aiProvider: Optional[str] = Field(None, alias="aiProvider", description="Tùy chọn ghi đè provider ('gemini' hoặc 'openrouter')")


class AnalyzeWritingResponse(CamelModel):
    submissionModuleId: int = Field(..., alias="submissionModuleId")
    overallScore: float = Field(..., alias="overallScore")
    aiFeedback: str = Field(..., alias="aiFeedback")
    textMetrics: WritingMetrics = Field(..., alias="textMetrics")
    criteriaScores: WritingCriteriaScores = Field(..., alias="criteriaScores")
    annotations: List[WritingAnnotationItem] = Field(default_factory=list, alias="annotations")
    modelUsed: str = Field(..., alias="modelUsed")
    providerUsed: str = Field(..., alias="providerUsed")
