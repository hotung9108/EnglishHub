package com.english_hub.core.modules.submission.infrastructure.mapper;

import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import org.springframework.stereotype.Component;

/**
 * Maps submission-cluster domain models to/from the shared JPA entities.
 * Domain and infra enums share identical value names, so conversion is a plain {@code valueOf(name)}.
 */
@Component
public class SubmissionPersistenceMapper {

	public Submission toDomain(com.english_hub.core.infrastructure.persistence.entity.Submission source) {
		Submission target = new Submission(
				source.getAssignmentId(),
				source.getStudentId(),
				source.getAttemptNumber(),
				source.getSubmittedAt(),
				SubmissionStatus.valueOf(source.getStatus().name()));
		target.setId(source.getId());
		target.setCreatedAt(source.getCreatedAt());
		target.setUpdatedAt(source.getUpdatedAt());
		return target;
	}

	public com.english_hub.core.infrastructure.persistence.entity.Submission toEntity(Submission source) {
		com.english_hub.core.infrastructure.persistence.entity.Submission target =
				new com.english_hub.core.infrastructure.persistence.entity.Submission(
				source.getAssignmentId(),
				source.getStudentId(),
				source.getAttemptNumber(),
				source.getSubmittedAt(),
				com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus.valueOf(source.getStatus().name()));
		target.setId(source.getId());
		return target;
	}

	public SubmissionModule toDomain(com.english_hub.core.infrastructure.persistence.entity.SubmissionModule source) {
		SubmissionModule target = new SubmissionModule(
				source.getSubmissionId(),
				source.getModuleId(),
				SubmissionStatus.valueOf(source.getStatus().name()));
		target.setId(source.getId());
		return target;
	}

	public com.english_hub.core.infrastructure.persistence.entity.SubmissionModule toEntity(SubmissionModule source) {
		com.english_hub.core.infrastructure.persistence.entity.SubmissionModule target =
				new com.english_hub.core.infrastructure.persistence.entity.SubmissionModule(
				source.getSubmissionId(),
				source.getModuleId(),
				com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus.valueOf(source.getStatus().name()));
		target.setId(source.getId());
		return target;
	}

	public Grading toDomain(com.english_hub.core.infrastructure.persistence.entity.Grading source) {
		Grading target = new Grading(
				source.getSubmissionModuleId(),
				GradingMethod.valueOf(source.getMethod().name()),
				GradingStatus.valueOf(source.getStatus().name()),
				source.getFinalScore(),
				source.getMaxScoreSnapshot());
		target.setId(source.getId());
		return target;
	}

	public com.english_hub.core.infrastructure.persistence.entity.Grading toEntity(Grading source) {
		com.english_hub.core.infrastructure.persistence.entity.Grading target =
				new com.english_hub.core.infrastructure.persistence.entity.Grading(
				source.getSubmissionModuleId(),
				com.english_hub.core.infrastructure.persistence.entity.GradingMethod.valueOf(source.getMethod().name()),
				com.english_hub.core.infrastructure.persistence.entity.GradingStatus.valueOf(source.getStatus().name()),
				null,
				source.getFinalScore(),
				null,
				source.getMaxScoreSnapshot(),
				null,
				null,
				null,
				null,
				null);
		target.setId(source.getId());
		return target;
	}
}