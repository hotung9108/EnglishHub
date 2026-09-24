package com.english_hub.core.modules.grading.infrastructure.mapper;

import com.english_hub.core.infrastructure.persistence.entity.AnswerAnnotation;
import com.english_hub.core.infrastructure.persistence.entity.GradingChangeLog;
import com.english_hub.core.modules.grading.domain.model.AnnotationSource;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingMethod;
import com.english_hub.core.modules.grading.domain.model.ReviewStatus;
import org.springframework.stereotype.Component;

@Component
public class GradingPersistenceMapper {

	public Grading toDomain(com.english_hub.core.infrastructure.persistence.entity.Grading source) {
		return new Grading(
				source.getId(),
				source.getSubmissionModuleId(),
				GradingMethod.valueOf(source.getMethod().name()),
				com.english_hub.core.modules.grading.domain.model.GradingStatus.valueOf(source.getStatus().name()),
				source.getAiFeedback(),
				source.getFinalScore(),
				source.getFinalFeedback(),
				source.getMaxScoreSnapshot(),
				source.getReviewedBy(),
				source.getReviewedAt(),
				source.getGradedAt(),
				source.getAiTranscript(),
				source.getAiInstructionSnapshot());
	}

	public com.english_hub.core.modules.grading.domain.model.AnswerAnnotation toDomain(AnswerAnnotation source) {
		return new com.english_hub.core.modules.grading.domain.model.AnswerAnnotation(
				source.getId(),
				source.getAnswerId(),
				AnnotationSource.valueOf(source.getSource().name()),
				source.getStartOffset(),
				source.getEndOffset(),
				source.getErrorType(),
				source.getComment(),
				source.getSuggestedFix(),
				ReviewStatus.valueOf(source.getReviewStatus().name()));
	}

	public AnswerAnnotation toNewEntity(
			com.english_hub.core.modules.grading.domain.model.AnswerAnnotation source) {
		return new AnswerAnnotation(
				source.answerId(),
				com.english_hub.core.infrastructure.persistence.entity.AnnotationSource.valueOf(source.source().name()),
				source.startOffset(),
				source.endOffset(),
				source.errorType(),
				source.comment(),
				source.suggestedFix(),
				com.english_hub.core.infrastructure.persistence.entity.ReviewStatus.valueOf(source.reviewStatus().name()));
	}

	public com.english_hub.core.modules.grading.domain.model.GradingChangeLog toDomain(GradingChangeLog source) {
		return new com.english_hub.core.modules.grading.domain.model.GradingChangeLog(
				source.getId(),
				source.getGradingId(),
				source.getChangedBy(),
				source.getOldScore(),
				source.getNewScore(),
				source.getNote(),
				source.getChangedAt());
	}

	public GradingChangeLog toNewEntity(
			com.english_hub.core.modules.grading.domain.model.GradingChangeLog source) {
		return new GradingChangeLog(
				source.gradingId(),
				source.changedBy(),
				source.oldScore(),
				source.newScore(),
				source.note(),
				source.changedAt());
	}
}
