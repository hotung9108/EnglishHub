package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Grading;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GradingRepository extends JpaRepository<Grading, Long>, JpaSpecificationExecutor<Grading> {

	Optional<Grading> findBySubmissionModuleId(Long submissionModuleId);
}
