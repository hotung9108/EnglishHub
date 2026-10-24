package com.english_hub.core.modules.module.presentation.rest.dto;

/**
 * Request body of {@code POST /api/v1/modules/{moduleId}/audio}. The declared
 * mime type decides both the allowlist check and the extension of the
 * generated storage key.
 */
public record AudioUploadUrlRequest(String mimeType) {
}
