package com.english_hub.core.modules.submission.application.port;

import java.time.OffsetDateTime;

/**
 * Provider-agnostic object-storage port. Implementations talk to any
 * S3-compatible store (Cloudflare R2, NeonDB Storage, MinIO, AWS S3) -
 * switching provider only requires changing the storage credentials/config.
 */
public interface StorageService {

	/**
	 * Generates a presigned PUT URL for {@code storageKey} that lets a client
	 * upload an object directly to the bucket without exposing credentials.
	 * The URL expires after a fixed 15-minute window.
	 */
	PresignedUpload generatePresignedPutUrl(String storageKey, String contentType);

	/**
	 * Generates a presigned GET URL for {@code storageKey} allowing temporary
	 * authenticated read access (e.g. for AI analysis microservice).
	 */
	default String generatePresignedGetUrl(String storageKey) {
		return null;
	}

	/**
	 * Fetches the raw bytes of the object directly from storage. Returns null if missing.
	 */
	default byte[] getObjectBytes(String storageKey) {
		return null;
	}

	/**
	 * Returns {@code true} when an object exists at {@code storageKey}.
	 */
	boolean objectExists(String storageKey);

	record PresignedUpload(String uploadUrl, String storageKey, OffsetDateTime expiresAt) {
	}
}