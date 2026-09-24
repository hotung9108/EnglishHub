package com.english_hub.core.modules.submission.infrastructure.storage;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.modules.submission.application.port.StorageService;

import org.springframework.http.HttpStatus;

/**
 * Fallback bean used when object storage is not configured yet. Keeps the
 * application bootable without credentials and reports a clear error on use.
 */
public class UnavailableStorageService implements StorageService {

	private static final String NOT_CONFIGURED_MESSAGE = "Lưu trữ chưa được cấu hình.";

	@Override
	public PresignedUpload generatePresignedPutUrl(String storageKey, String contentType) {
		throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, NOT_CONFIGURED_MESSAGE);
	}

	@Override
	public boolean objectExists(String storageKey) {
		throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, NOT_CONFIGURED_MESSAGE);
	}
}