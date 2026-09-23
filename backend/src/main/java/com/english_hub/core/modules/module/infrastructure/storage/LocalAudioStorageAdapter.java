package com.english_hub.core.modules.module.infrastructure.storage;

import com.english_hub.core.modules.module.application.port.AudioStorageException;
import com.english_hub.core.modules.module.application.port.AudioStoragePort;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class LocalAudioStorageAdapter implements AudioStoragePort {

	private static final long MAX_AUDIO_BYTES = 25L * 1024 * 1024;
	private static final Set<String> AUDIO_CONTENT_TYPES = Set.of(
			"audio/mpeg",
			"audio/mp3",
			"audio/wav",
			"audio/x-wav",
			"audio/wave",
			"audio/mp4",
			"audio/m4a",
			"audio/x-m4a",
			"video/mp4",
			"application/octet-stream");
	private static final String INVALID_AUDIO_MESSAGE = "File audio không hợp lệ.";

	private final Path storageRoot;

	public LocalAudioStorageAdapter(
			@Value("${app.storage.local-root:./.local/backend-storage}") String storageRoot) {
		this.storageRoot = Path.of(storageRoot).toAbsolutePath().normalize();
	}

	@Override
	public StoredAudio store(Long moduleId, MultipartFile file) {
		validateAudioFile(file);
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

	private void validateAudioFile(MultipartFile file) {
		if (file == null || file.isEmpty() || file.getSize() > MAX_AUDIO_BYTES) {
			throw new AudioStorageException(INVALID_AUDIO_MESSAGE, null);
		}
		String extension = extensionOf(file.getOriginalFilename());
		if (extension == null) {
			throw new AudioStorageException(INVALID_AUDIO_MESSAGE, null);
		}
		String contentType = file.getContentType();
		if (contentType != null && !AUDIO_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
			throw new AudioStorageException(INVALID_AUDIO_MESSAGE, null);
		}
		try (InputStream input = file.getInputStream()) {
			byte[] header = input.readNBytes(12);
			if (!matchesAudioSignature(extension, header)) {
				throw new AudioStorageException(INVALID_AUDIO_MESSAGE, null);
			}
		} catch (IOException exception) {
			throw new AudioStorageException(INVALID_AUDIO_MESSAGE, exception);
		}
	}

	private String extensionOf(String originalFilename) {
		if (originalFilename == null) {
			return null;
		}
		String normalized = originalFilename.toLowerCase(Locale.ROOT);
		int dotIndex = normalized.lastIndexOf('.');
		if (dotIndex < 0) {
			return null;
		}
		String extension = normalized.substring(dotIndex);
		return Set.of(".mp3", ".wav", ".m4a").contains(extension) ? extension : null;
	}

	private boolean matchesAudioSignature(String extension, byte[] header) {
		if (".wav".equals(extension)) {
			return header.length >= 12
					&& header[0] == 'R'
					&& header[1] == 'I'
					&& header[2] == 'F'
					&& header[3] == 'F'
					&& header[8] == 'W'
					&& header[9] == 'A'
					&& header[10] == 'V'
					&& header[11] == 'E';
		}
		if (".m4a".equals(extension)) {
			return header.length >= 8
					&& header[4] == 'f'
					&& header[5] == 't'
					&& header[6] == 'y'
					&& header[7] == 'p';
		}
		return header.length >= 3 && header[0] == 'I' && header[1] == 'D' && header[2] == '3'
				|| header.length >= 2
						&& (header[0] & 0xFF) == 0xFF
						&& (header[1] & 0xE0) == 0xE0;
	}
}
