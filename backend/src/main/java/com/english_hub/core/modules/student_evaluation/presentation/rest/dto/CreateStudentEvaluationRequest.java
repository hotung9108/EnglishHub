package com.english_hub.core.modules.student_evaluation.presentation.rest.dto;

import com.english_hub.core.modules.student_evaluation.application.command.CreateStudentEvaluationCommand;

public record CreateStudentEvaluationRequest(Long classId, String content) {

	public CreateStudentEvaluationCommand toCommand() {
		return new CreateStudentEvaluationCommand(classId, content);
	}
}
