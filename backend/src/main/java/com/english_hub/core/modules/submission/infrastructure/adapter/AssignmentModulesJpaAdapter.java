package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;

import java.util.List;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the submission-context {@code AssignmentModuleRepository} read port. */
@Repository
public class AssignmentModulesJpaAdapter
		implements com.english_hub.core.modules.submission.domain.repository.AssignmentModuleRepository {

	private final AssignmentModuleRepository jpaRepository;

	public AssignmentModulesJpaAdapter(AssignmentModuleRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ModuleInfo> findModulesByAssignmentId(Long assignmentId) {
		return jpaRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId).stream()
				.map(AssignmentModulesJpaAdapter::toModuleInfo)
				.toList();
	}

	private static ModuleInfo toModuleInfo(AssignmentModule entity) {
		return new ModuleInfo(
				entity.getId(),
				entity.getAssignmentId(),
				ModuleSkill.valueOf(entity.getSkill().name()),
				ModuleTaskType.valueOf(entity.getTaskType().name()),
				entity.getOrderIndex());
	}
}