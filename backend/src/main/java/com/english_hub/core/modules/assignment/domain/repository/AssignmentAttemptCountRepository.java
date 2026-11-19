package com.english_hub.core.modules.assignment.domain.repository;

public interface AssignmentAttemptCountRepository {

	/** Returns the highest number of attempts by one student, or zero if there are none. */
	long findHighestAttemptCount(Long assignmentId);
}
