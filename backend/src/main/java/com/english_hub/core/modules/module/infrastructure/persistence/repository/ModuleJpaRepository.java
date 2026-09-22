package com.english_hub.core.modules.module.infrastructure.persistence.repository;

import com.english_hub.core.modules.module.infrastructure.persistence.entity.ModuleJpaEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModuleJpaRepository extends JpaRepository<ModuleJpaEntity, Long> {

	List<ModuleJpaEntity> findByAssignmentIdOrderByOrderIndexAsc(Long assignmentId);

	boolean existsByAssignmentIdAndOrderIndex(Long assignmentId, int orderIndex);

	boolean existsByAssignmentIdAndOrderIndexAndIdNot(Long assignmentId, int orderIndex, Long id);
}
