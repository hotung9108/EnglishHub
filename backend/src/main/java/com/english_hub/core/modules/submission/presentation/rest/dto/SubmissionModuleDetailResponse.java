package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionModuleDetailResult;

import java.util.List;

public record SubmissionModuleDetailResponse(
		Long id,
		Long moduleId,
		String skill,
		String taskType,
		String status,
		GradingDetailResponse grading,
		List<QuestionResponse> questions,
		List<AnswerDetailResponse> answers) {

	public static SubmissionModuleDetailResponse from(SubmissionModuleDetailResult result) {
		return new SubmissionModuleDetailResponse(
				result.id(),
				result.moduleId(),
				result.skill() == null ? null : result.skill().name(),
				result.taskType() == null ? null : result.taskType().name(),
				result.status().name(),
				result.grading() == null ? null : GradingDetailResponse.from(result.grading()),
				result.questions().stream().map(QuestionResponse::from).toList(),
				result.answers().stream().map(AnswerDetailResponse::from).toList());
	}
}