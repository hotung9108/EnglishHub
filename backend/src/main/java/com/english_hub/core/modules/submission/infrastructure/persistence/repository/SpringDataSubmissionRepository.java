package com.english_hub.core.modules.submission.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/** Spring Data handle for the shared {@code submissions} JPA entity used by the submission cluster. */
public interface SpringDataSubmissionRepository
		extends JpaRepository<Submission, Long>, JpaSpecificationExecutor<Submission> {

	long countByAssignmentIdAndStudentId(Long assignmentId, Long studentId);
}