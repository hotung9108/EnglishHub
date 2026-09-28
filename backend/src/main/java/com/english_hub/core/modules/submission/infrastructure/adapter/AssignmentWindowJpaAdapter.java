package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.modules.submission.domain.model.AssignmentStatus;
import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import com.english_hub.core.modules.submission.domain.repository.AssignmentWindowRepository;

import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link AssignmentWindowRepository} read port. */
@Repository
public class AssignmentWindowJpaAdapter implements AssignmentWindowRepository {

	private final AssignmentRepository assignmentRepository;

	public AssignmentWindowJpaAdapter(AssignmentRepository assignmentRepository) {
		this.assignmentRepository = assignmentRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<AssignmentWindow> findWindowById(Long assignmentId) {
		return assignmentRepository.findById(assignmentId).map(AssignmentWindowJpaAdapter::toWindow);
	}

	private static AssignmentWindow toWindow(Assignment entity) {
		return new AssignmentWindow(
				entity.getId(),
				entity.getClassId(),
				AssignmentStatus.valueOf(entity.getStatus().name()),
				entity.getOpenAt(),
				entity.getCloseAt(),
				entity.getMaxSubmissions(),
				entity.isDeleted());
	}
}