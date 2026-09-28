package com.english_hub.core.modules.student_evaluation.domain.repository;

import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationFilter;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationPage;
import java.util.Optional;

public interface StudentEvaluationRepository {

	Optional<StudentEvaluation> findById(Long id);

	StudentEvaluationPage findPage(StudentEvaluationFilter filter, int page, int limit);

	StudentEvaluation save(StudentEvaluation evaluation);

	void deleteById(Long id);
}
