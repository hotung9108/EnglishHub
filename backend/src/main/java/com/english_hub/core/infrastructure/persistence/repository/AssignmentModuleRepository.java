package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentModuleRepository extends JpaRepository<AssignmentModule, Long> {

	List<AssignmentModule> findByAssignmentIdOrderByOrderIndexAsc(Long assignmentId);

	boolean existsByAssignmentIdAndOrderIndex(Long assignmentId, int orderIndex);

	boolean existsByAssignmentIdAndOrderIndexAndIdNot(Long assignmentId, int orderIndex, Long id);
}
