package com.english_hub.core.modules.module.presentation.rest.dto;

public record AudioUploadResponse(
		String message,
		String sourceAudioStorageKey,
		String sourceAudioUploadStatus) {
}
