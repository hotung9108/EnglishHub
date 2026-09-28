package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionModuleRepository extends JpaRepository<SubmissionModule, Long> {

	boolean existsByModuleId(Long moduleId);
}
