package com.english_hub.backend.evaluations.repository;

import com.english_hub.backend.evaluations.entity.StudentEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentEvaluationRepository extends JpaRepository<StudentEvaluation, Long> {
}
