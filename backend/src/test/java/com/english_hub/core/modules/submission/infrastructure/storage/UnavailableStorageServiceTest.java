package com.english_hub.core.modules.submission.infrastructure.storage;

import com.english_hub.core.common.ApiException;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UnavailableStorageServiceTest {

	private final UnavailableStorageService storageService = new UnavailableStorageService();

	@Test
	void generatePresignedPutUrl_throwsClearError_whenStorageNotConfigured() {
		assertThatThrownBy(() -> storageService.generatePresignedPutUrl("key", "application/pdf"))
				.isInstanceOf(ApiException.class)
				.extracting(exception -> ((ApiException) exception).getStatus())
				.isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
		assertThatThrownBy(() -> storageService.generatePresignedPutUrl("key", "application/pdf"))
				.hasMessage("Lưu trữ chưa được cấu hình.");
	}

	@Test
	void objectExists_throwsClearError_whenStorageNotConfigured() {
		assertThatThrownBy(() -> storageService.objectExists("key"))
				.isInstanceOf(ApiException.class)
				.hasMessage("Lưu trữ chưa được cấu hình.");
	}
}