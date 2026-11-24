package com.english_hub.core.modules.module.presentation.rest.dto;

import com.english_hub.core.modules.module.application.service.ModuleService.AudioUploadUrlResult;

import java.time.OffsetDateTime;

/**
 * Response of {@code POST /api/v1/modules/{moduleId}/audio}. The client PUTs
 * the raw file to {@code uploadUrl} with the same {@code Content-Type}, then
 * confirms via {@code POST /api/v1/modules/{moduleId}/audio/confirm}.
 */
public record AudioUploadUrlResponse(
		String message,
		String uploadUrl,
		String storageKey,
		OffsetDateTime expiresAt,
		String sourceAudioUploadStatus) {

	public static AudioUploadUrlResponse of(String message, AudioUploadUrlResult result) {
		return new AudioUploadUrlResponse(
				message,
				result.uploadUrl(),
				result.storageKey(),
				result.expiresAt(),
				result.uploadStatus());
	}
}
