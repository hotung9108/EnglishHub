package com.english_hub.core.modules.module.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.module.infrastructure.mapper.ModulePersistenceMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class AssignmentModulePersistenceAdapter implements ModuleRepository {

	private final AssignmentModuleRepository assignmentModuleRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final ModulePersistenceMapper mapper;

	public AssignmentModulePersistenceAdapter(
			AssignmentModuleRepository assignmentModuleRepository,
			SubmissionModuleRepository submissionModuleRepository,
			ModulePersistenceMapper mapper) {
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.mapper = mapper;
	}

	@Override
	public List<Module> findByAssignmentIdOrderByOrderIndexAsc(Long assignmentId) {
		return assignmentModuleRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId).stream()
				.map(mapper::toDomain)
				.toList();
	}

	@Override
	public Optional<Module> findById(Long id) {
		return assignmentModuleRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public Optional<Module> findByIdForUpdate(Long id) {
		return assignmentModuleRepository.findByIdForUpdate(id).map(mapper::toDomain);
	}

	@Override
	public Module save(Module module) {
		AssignmentModule saved;
		if (module.id() == null) {
			saved = assignmentModuleRepository.save(mapper.toNewEntity(module));
		} else {
			AssignmentModule target = assignmentModuleRepository.findById(module.id())
					.orElseThrow(() -> new IllegalArgumentException("Module not found: " + module.id()));
			mapper.updateEntity(target, module);
			saved = assignmentModuleRepository.save(target);
		}
		return mapper.toDomain(saved);
	}

	@Override
	public boolean existsByAssignmentIdAndOrderIndex(Long assignmentId, int orderIndex) {
		return assignmentModuleRepository.existsByAssignmentIdAndOrderIndex(assignmentId, orderIndex);
	}

	@Override
	public boolean existsByAssignmentIdAndOrderIndexAndIdNot(
			Long assignmentId,
			int orderIndex,
			Long moduleId) {
		return assignmentModuleRepository.existsByAssignmentIdAndOrderIndexAndIdNot(assignmentId, orderIndex, moduleId);
	}

	@Override
	public boolean existsSubmissionReference(Long moduleId) {
		return submissionModuleRepository.existsByModuleId(moduleId);
	}

	@Override
	public void deleteById(Long id) {
		assignmentModuleRepository.deleteById(id);
	}
}
