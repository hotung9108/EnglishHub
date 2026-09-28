package com.english_hub.core.modules.module.application.port;

import org.springframework.web.multipart.MultipartFile;

public interface AudioStoragePort {

	StoredAudio store(Long moduleId, MultipartFile file);

	void delete(String storageKey);

	record StoredAudio(String storageKey, String mimeType, Integer durationSeconds) {
	}
}
