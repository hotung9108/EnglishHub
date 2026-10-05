from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional


class CamelModel(BaseModel):
    """Base model with camelCase serialization and deserialization."""
    model_config = ConfigDict(
        populate_by_name=True,
        serialize_by_alias=True
    )


class WordTimestamp(CamelModel):
    word: str
    start: float
    end: float
    confidence: float = 0.95


class FluencyMetrics(CamelModel):
    wordsPerMinute: float = Field(..., alias="wordsPerMinute")
    pauseCount: int = Field(..., alias="pauseCount")
    totalDurationSeconds: float = Field(..., alias="totalDurationSeconds")
    phonationTimeRatio: float = Field(..., alias="phonationTimeRatio")


class CriteriaScores(CamelModel):
    fluencyAndCoherence: float = Field(..., alias="fluencyAndCoherence")
    lexicalResource: float = Field(..., alias="lexicalResource")
    grammaticalRangeAndAccuracy: float = Field(..., alias="grammaticalRangeAndAccuracy")
    pronunciation: float = Field(..., alias="pronunciation")
    overallScore: float = Field(..., alias="overallScore")


class AnnotationItem(CamelModel):
    startOffset: int = Field(..., alias="startOffset")
    endOffset: int = Field(..., alias="endOffset")
    errorType: str = Field(..., alias="errorType")
    comment: str = Field(..., alias="comment")
    suggestedFix: Optional[str] = Field(None, alias="suggestedFix")


class AnalyzeSpeakingRequest(CamelModel):
    submissionModuleId: int = Field(..., alias="submissionModuleId")
    audioUrl: Optional[str] = Field(None, alias="audioUrl")
    audioBase64: Optional[str] = Field(None, alias="audioBase64")
    audioStorageKey: Optional[str] = Field(None, alias="audioStorageKey")
    moduleInstructions: Optional[str] = Field(None, alias="moduleInstructions")
    aiInstructionSnapshot: Optional[str] = Field(None, alias="aiInstructionSnapshot")
    maxScore: float = Field(9.0, alias="maxScore")
    model: Optional[str] = Field(None, alias="model", description="Tùy chọn ghi đè model AI (ví dụ: google/gemini-2.5-flash, gemini-1.5-pro)")
    aiProvider: Optional[str] = Field(None, alias="aiProvider", description="Tùy chọn ghi đè AI provider ('openrouter' hoặc 'gemini')")


class AnalyzeSpeakingResponse(CamelModel):
    submissionModuleId: int = Field(..., alias="submissionModuleId")
    overallScore: float = Field(..., alias="overallScore")
    aiFeedback: str = Field(..., alias="aiFeedback")
    aiTranscript: List[WordTimestamp] = Field(..., alias="aiTranscript")
    fluencyMetrics: FluencyMetrics = Field(..., alias="fluencyMetrics")
    criteriaScores: CriteriaScores = Field(..., alias="criteriaScores")
    annotations: List[AnnotationItem] = Field(default_factory=list, alias="annotations")
    modelUsed: Optional[str] = Field(None, alias="modelUsed", description="Model AI thực tế đã dùng để chấm bài")
    providerUsed: Optional[str] = Field(None, alias="providerUsed", description="Provider AI thực tế đã phục vụ request")
