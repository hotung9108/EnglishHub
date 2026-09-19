package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.AnswerAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerAnnotationRepository extends JpaRepository<AnswerAnnotation, Long> {
}
