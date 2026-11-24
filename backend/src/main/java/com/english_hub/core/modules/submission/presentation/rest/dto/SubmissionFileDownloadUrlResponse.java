package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionFileDownloadResult;

import java.time.OffsetDateTime;

/**
 * Response containing a presigned GET URL for downloading or playing
 * a student submission file (speaking audio or essay document).
 */
public record SubmissionFileDownloadUrlResponse(
		Long submissionModuleId,
		String downloadUrl,
		String storageKey,
		String fileName,
		String mimeType,
		OffsetDateTime expiresAt) {

	public static SubmissionFileDownloadUrlResponse from(SubmissionFileDownloadResult result) {
		return new SubmissionFileDownloadUrlResponse(
				result.submissionModuleId(),
				result.downloadUrl(),
				result.storageKey(),
				result.fileName(),
				result.mimeType(),
				result.expiresAt());
	}
}
