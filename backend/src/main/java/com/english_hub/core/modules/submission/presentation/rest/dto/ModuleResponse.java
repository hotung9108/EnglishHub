package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleEntry;

public record ModuleResponse(
		Long id,
		Long moduleId,
		String skill,
		String status) {

	public static ModuleResponse from(ModuleEntry entry) {
		return new ModuleResponse(
				entry.submissionModuleId(),
				entry.moduleId(),
				entry.skill().name(),
				entry.status().name());
	}
}