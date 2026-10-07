package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleDetailResult;

public record ModuleDetailResponse(
		Long id,
		Long moduleId,
		String skill,
		String taskType,
		String status,
		GradingDetailResponse grading) {

	public static ModuleDetailResponse from(ModuleDetailResult result) {
		return new ModuleDetailResponse(
				result.submissionModuleId(),
				result.moduleId(),
				result.skill() == null ? null : result.skill().name(),
				result.taskType() == null ? null : result.taskType().name(),
				result.status().name(),
				result.grading() == null ? null : GradingDetailResponse.from(result.grading()));
	}
}