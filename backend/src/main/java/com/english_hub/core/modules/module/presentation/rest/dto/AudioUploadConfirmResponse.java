package com.english_hub.core.modules.module.presentation.rest.dto;

/**
 * Response of {@code POST /api/v1/modules/{moduleId}/audio/confirm}.
 * {@code sourceAudioUploadStatus} is {@code READY} when the direct PUT
 * reached object storage, otherwise {@code FAILED}.
 */
public record AudioUploadConfirmResponse(
		String message,
		String sourceAudioStorageKey,
		String sourceAudioUploadStatus) {
}
