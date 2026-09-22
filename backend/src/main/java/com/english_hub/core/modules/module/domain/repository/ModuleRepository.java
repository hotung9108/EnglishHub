package com.english_hub.core.modules.module.domain.repository;

import com.english_hub.core.modules.module.domain.model.Module;
import java.util.List;
import java.util.Optional;

public interface ModuleRepository {

	List<Module> findByAssignmentIdOrderByOrderIndexAsc(Long assignmentId);

	Optional<Module> findById(Long id);

	Module save(Module module);

	boolean existsByAssignmentIdAndOrderIndex(Long assignmentId, int orderIndex);

	boolean existsByAssignmentIdAndOrderIndexAndIdNot(Long assignmentId, int orderIndex, Long moduleId);

	boolean existsSubmissionReference(Long moduleId);

	void deleteById(Long id);
}
