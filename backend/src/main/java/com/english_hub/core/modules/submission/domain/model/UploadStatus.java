package com.english_hub.core.modules.submission.domain.model;

/** Domain mirror of the shared {@code upload_status} enum for audio/doc answers. */
public enum UploadStatus {
	UPLOADING,
	PROCESSING,
	READY,
	FAILED
}