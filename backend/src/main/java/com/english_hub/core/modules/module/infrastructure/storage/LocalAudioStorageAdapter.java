package com.english_hub.core.modules.module.infrastructure.storage;

import com.english_hub.core.modules.module.application.port.AudioStorageException;
import com.english_hub.core.modules.module.application.port.AudioStoragePort;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class LocalAudioStorageAdapter implements AudioStoragePort {

	private final Path storageRoot;

	public LocalAudioStorageAdapter(
			@Value("${app.storage.local-root:./.local/backend-storage}") String storageRoot) {
		this.storageRoot = Path.of(storageRoot).toAbsolutePath().normalize();
	}

	@Override
	public StoredAudio store(Long moduleId, MultipartFile file) {
		String extension = extensionOf(file.getOriginalFilename());
		String storageKey = "modules/" + moduleId + "/audio/" + UUID.randomUUID() + extension;
		Path target = storageRoot.resolve(storageKey).normalize();
		if (!target.startsWith(storageRoot)) {
			throw new AudioStorageException("Audio storage path is invalid.", null);
		}

		try {
			Files.createDirectories(target.getParent());
			try (InputStream input = file.getInputStream()) {
				Files.copy(input, target, StandardCopyOption.REPLACE_EXISTING);
			}
			return new StoredAudio(storageKey, file.getContentType(), null);
		} catch (IOException | RuntimeException exception) {
			try {
				Files.deleteIfExists(target);
			} catch (IOException cleanupException) {
				exception.addSuppressed(cleanupException);
			}
			throw new AudioStorageException("Không thể lưu file audio.", exception);
		}
	}

	@Override
	public void delete(String storageKey) {
		Path target = storageRoot.resolve(storageKey).normalize();
		if (!target.startsWith(storageRoot)) {
			throw new AudioStorageException("Audio storage path is invalid.", null);
		}
		try {
			Files.deleteIfExists(target);
		} catch (IOException exception) {
			throw new AudioStorageException("Không thể xoá file audio tạm.", exception);
		}
	}

	private String extensionOf(String originalFilename) {
		if (originalFilename == null) {
			return ".audio";
		}
		String normalized = originalFilename.toLowerCase(Locale.ROOT);
		int dotIndex = normalized.lastIndexOf('.');
		return dotIndex >= 0 ? normalized.substring(dotIndex) : ".audio";
	}
}
