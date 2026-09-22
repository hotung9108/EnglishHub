package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AssignmentRepository
		extends JpaRepository<Assignment, Long>, JpaSpecificationExecutor<Assignment> {

	boolean existsByClassId(Long classId);

	long countByDeletedFalse();
}
