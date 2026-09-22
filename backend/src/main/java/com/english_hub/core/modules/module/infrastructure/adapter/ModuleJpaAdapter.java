package com.english_hub.core.modules.module.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.module.infrastructure.mapper.ModulePersistenceMapper;
import com.english_hub.core.modules.module.infrastructure.persistence.entity.ModuleJpaEntity;
import com.english_hub.core.modules.module.infrastructure.persistence.repository.ModuleJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class ModuleJpaAdapter implements ModuleRepository {

	private final ModuleJpaRepository moduleJpaRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final ModulePersistenceMapper mapper;

	public ModuleJpaAdapter(
			ModuleJpaRepository moduleJpaRepository,
			SubmissionModuleRepository submissionModuleRepository,
			ModulePersistenceMapper mapper) {
		this.moduleJpaRepository = moduleJpaRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.mapper = mapper;
	}

	@Override
	public List<Module> findByAssignmentIdOrderByOrderIndexAsc(Long assignmentId) {
		return moduleJpaRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId).stream()
				.map(mapper::toDomain)
				.toList();
	}

	@Override
	public Optional<Module> findById(Long id) {
		return moduleJpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public Module save(Module module) {
		ModuleJpaEntity saved;
		if (module.id() == null) {
			saved = moduleJpaRepository.save(mapper.toNewEntity(module));
		} else {
			ModuleJpaEntity target = moduleJpaRepository.findById(module.id())
					.orElseThrow(() -> new IllegalArgumentException("Module not found: " + module.id()));
			mapper.updateEntity(target, module);
			saved = moduleJpaRepository.save(target);
		}
		return mapper.toDomain(saved);
	}

	@Override
	public boolean existsByAssignmentIdAndOrderIndex(Long assignmentId, int orderIndex) {
		return moduleJpaRepository.existsByAssignmentIdAndOrderIndex(assignmentId, orderIndex);
	}

	@Override
	public boolean existsByAssignmentIdAndOrderIndexAndIdNot(
			Long assignmentId,
			int orderIndex,
			Long moduleId) {
		return moduleJpaRepository.existsByAssignmentIdAndOrderIndexAndIdNot(assignmentId, orderIndex, moduleId);
	}

	@Override
	public boolean existsSubmissionReference(Long moduleId) {
		return submissionModuleRepository.existsByModuleId(moduleId);
	}

	@Override
	public void deleteById(Long id) {
		moduleJpaRepository.deleteById(id);
	}
}
