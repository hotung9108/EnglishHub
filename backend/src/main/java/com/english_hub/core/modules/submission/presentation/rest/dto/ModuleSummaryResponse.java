package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleSummaryResult;

public record ModuleSummaryResponse(
		Long id,
		Long moduleId,
		String skill,
		String taskType,
		String status,
		GradingSummaryResponse grading) {

	public static ModuleSummaryResponse from(ModuleSummaryResult result) {
		return new ModuleSummaryResponse(
				result.submissionModuleId(),
				result.moduleId(),
				result.skill() == null ? null : result.skill().name(),
				result.taskType() == null ? null : result.taskType().name(),
				result.status().name(),
				result.grading() == null ? null : GradingSummaryResponse.from(result.grading()));
	}
}