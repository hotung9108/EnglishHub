package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface StudentEvaluationRepository
		extends JpaRepository<StudentEvaluation, Long>, JpaSpecificationExecutor<StudentEvaluation> {

	boolean existsByClassId(Long classId);
}
