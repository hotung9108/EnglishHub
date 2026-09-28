package com.english_hub.core.modules.grading.domain.repository;

import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import java.util.List;
import java.util.Optional;

public interface AnswerAnnotationRepository {

	Optional<AnswerAnnotation> findById(Long id);

	List<AnswerAnnotation> findByAnswerId(Long answerId);

	AnswerAnnotation save(AnswerAnnotation annotation);

	void deleteById(Long id);
}
