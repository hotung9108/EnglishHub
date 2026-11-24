package com.english_hub.core.modules.module.presentation.rest.dto;

/**
 * Request body of {@code POST /api/v1/modules/{moduleId}/audio/confirm}. The
 * storageKey must be the one returned by the upload-url step for this module.
 */
public record AudioUploadConfirmRequest(String storageKey) {
}
