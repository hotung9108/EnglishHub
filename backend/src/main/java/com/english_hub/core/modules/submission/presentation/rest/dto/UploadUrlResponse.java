package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.UploadUrlResult;

import java.time.OffsetDateTime;

public record UploadUrlResponse(String uploadUrl, String storageKey, OffsetDateTime expiresAt) {

	public static UploadUrlResponse from(UploadUrlResult result) {
		return new UploadUrlResponse(result.uploadUrl(), result.storageKey(), result.expiresAt());
	}
}