package com.english_hub.core.modules.assignment.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentAttemptCountRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class AssignmentAttemptCountJpaAdapter implements AssignmentAttemptCountRepository {

	private final SubmissionRepository submissionRepository;

	public AssignmentAttemptCountJpaAdapter(SubmissionRepository submissionRepository) {
		this.submissionRepository = submissionRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public long findHighestAttemptCount(Long assignmentId) {
		List<Long> counts = submissionRepository.findAttemptCountsByAssignmentId(assignmentId, PageRequest.of(0, 1));
		return counts.isEmpty() ? 0L : counts.getFirst();
	}
}
