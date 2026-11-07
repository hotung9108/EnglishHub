package com.english_hub.core.modules.module.presentation.rest.dto;

import com.english_hub.core.modules.module.application.service.ModuleService.AudioDownloadUrlResult;

import java.time.OffsetDateTime;

/**
 * Response of {@code GET /api/v1/modules/{moduleId}/audio-download-url}.
 * Contains the temporary presigned GET URL to stream or download listening audio.
 */
public record AudioDownloadUrlResponse(
		String message,
		Long moduleId,
		String downloadUrl,
		String storageKey,
		String mimeType,
		Integer durationSeconds,
		OffsetDateTime expiresAt) {

	public static AudioDownloadUrlResponse of(String message, AudioDownloadUrlResult result) {
		return new AudioDownloadUrlResponse(
				message,
				result.moduleId(),
				result.downloadUrl(),
				result.storageKey(),
				result.mimeType(),
				result.durationSeconds(),
				result.expiresAt());
	}
}
