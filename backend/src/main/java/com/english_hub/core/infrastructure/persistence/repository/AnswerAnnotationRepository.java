package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.AnswerAnnotation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerAnnotationRepository extends JpaRepository<AnswerAnnotation, Long> {

	List<AnswerAnnotation> findByAnswerIdOrderByIdAsc(Long answerId);
}
