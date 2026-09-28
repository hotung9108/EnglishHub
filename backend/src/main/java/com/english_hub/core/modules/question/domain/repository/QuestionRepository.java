package com.english_hub.core.modules.question.domain.repository;

import com.english_hub.core.modules.question.domain.model.Question;
import java.util.List;
import java.util.Optional;

public interface QuestionRepository {

	List<Question> findByModuleIdOrderByOrderIndexAsc(Long moduleId);

	Optional<Question> findById(Long id);

	Question save(Question question);

	boolean existsByModuleIdAndOrderIndex(Long moduleId, int orderIndex);

	boolean existsByModuleIdAndOrderIndexAndIdNot(Long moduleId, int orderIndex, Long questionId);

	boolean existsAnswerReference(Long questionId);

	void deleteById(Long id);
}
