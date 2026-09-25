package com.english_hub.core.modules.submission.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.submission.application.page.SubmissionPageRequest;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionFilter;
import com.english_hub.core.modules.submission.domain.model.SubmissionPage;

/** Domain port for the {@code submissions} aggregate. */
public interface SubmissionRepository extends IRepository<Submission, Long> {

	/** Creates a new in-progress attempt for a student on an assignment. */
	Submission create(Long assignmentId, Long studentId, int attemptNumber);

	/** Counts attempts already taken by a student on an assignment (for max-submissions checks). */
	long countByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

	/** Paginated listing filtered by optional {@code assignmentId}/{@code studentId}/{@code status}. */
	SubmissionPage findPage(SubmissionFilter filter, SubmissionPageRequest pageRequest);
}