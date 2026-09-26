package com.english_hub.core.modules.student_evaluation.presentation.rest.dto;

import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;

public record StudentEvaluationResponse(Long id, String content) {

	public static StudentEvaluationResponse from(StudentEvaluation evaluation) {
		return new StudentEvaluationResponse(evaluation.id(), evaluation.content());
	}
}
