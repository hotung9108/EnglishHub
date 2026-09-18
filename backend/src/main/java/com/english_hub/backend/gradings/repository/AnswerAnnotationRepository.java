package com.english_hub.backend.gradings.repository;

import com.english_hub.backend.gradings.entity.AnswerAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerAnnotationRepository extends JpaRepository<AnswerAnnotation, Long> {
}
