package com.english_hub.core.modules.student_evaluation.presentation.rest.dto;

import com.english_hub.core.modules.student_evaluation.application.command.UpdateStudentEvaluationCommand;

public record UpdateStudentEvaluationRequest(String content) {

	public UpdateStudentEvaluationCommand toCommand() {
		return new UpdateStudentEvaluationCommand(content);
	}
}
