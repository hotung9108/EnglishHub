package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.StudentEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentEvaluationRepository extends JpaRepository<StudentEvaluation, Long> {
}
