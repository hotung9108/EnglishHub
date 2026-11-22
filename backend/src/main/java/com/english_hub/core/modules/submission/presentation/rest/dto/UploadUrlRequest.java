package com.english_hub.core.modules.submission.presentation.rest.dto;

public record UploadUrlRequest(String mimeType, Long fileSizeBytes) {

	public UploadUrlRequest(String mimeType) {
		this(mimeType, null);
	}
}