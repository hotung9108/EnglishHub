package com.english_hub.core.modules.module.infrastructure.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.english_hub.core.modules.module.application.port.AudioStorageException;
import com.english_hub.core.modules.module.application.port.AudioStoragePort;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

class LocalAudioStorageAdapterTest {

	@TempDir
	Path storageRoot;

	private LocalAudioStorageAdapter adapter;

	@BeforeEach
	void setUp() {
		adapter = new LocalAudioStorageAdapter(storageRoot.toString());
	}

	@Test
	void storesAndDeletesValidAudioFile() throws Exception {
		byte[] content = audioBytes(6, 'I', 'D', '3');
		MockMultipartFile file = new MockMultipartFile(
				"file", "source.mp3", "audio/mpeg", content);

		AudioStoragePort.StoredAudio stored = adapter.store(42L, file);

		assertThat(stored.storageKey()).startsWith("modules/42/audio/").endsWith(".mp3");
		Path storedPath = storageRoot.resolve(stored.storageKey());
		assertThat(Files.readAllBytes(storedPath)).containsExactly(content);
		assertThat(stored.mimeType()).isEqualTo("audio/mpeg");

		adapter.delete(stored.storageKey());

		assertThat(Files.exists(storedPath)).isFalse();
	}

	@Test
	void acceptsAudioAtExactTwentyFiveMiBBoundary() throws Exception {
		MockMultipartFile file = new MockMultipartFile(
				"file",
				"boundary.mp3",
				"audio/mpeg",
				audioBytes(25 * 1024 * 1024, 'I', 'D', '3'));

		AudioStoragePort.StoredAudio stored = adapter.store(42L, file);

		assertThat(Files.size(storageRoot.resolve(stored.storageKey()))).isEqualTo(25L * 1024 * 1024);
	}

	@Test
	void rejectsAudioOneByteOverTwentyFiveMiBBoundary() {
		MockMultipartFile file = new MockMultipartFile(
				"file",
				"too-large.mp3",
				"audio/mpeg",
				audioBytes(25 * 1024 * 1024 + 1, 'I', 'D', '3'));

		assertInvalidAudio(file);
	}

	@Test
	void rejectsFilenameWithoutExtension() {
		assertInvalidAudio(new MockMultipartFile(
				"file", "source", "audio/mpeg", audioBytes(6, 'I', 'D', '3')));
	}

	@Test
	void acceptsUppercaseExtensionAndNormalizesStoredKey() {
		MockMultipartFile file = new MockMultipartFile(
				"file", "SOURCE.MP3", "audio/mpeg", audioBytes(6, 'I', 'D', '3'));

		AudioStoragePort.StoredAudio stored = adapter.store(42L, file);

		assertThat(stored.storageKey()).endsWith(".mp3");
	}

	@Test
	void acceptsNullMimeTypeWhenAudioSignatureIsValid() {
		MockMultipartFile file = new MockMultipartFile(
				"file", "source.mp3", null, audioBytes(6, 'I', 'D', '3'));

		AudioStoragePort.StoredAudio stored = adapter.store(42L, file);

		assertThat(stored.mimeType()).isNull();
	}

	@Test
	void rejectsValidMp3SignatureWithWavExtension() {
		assertInvalidAudio(new MockMultipartFile(
				"file", "source.wav", "audio/wav", audioBytes(6, 'I', 'D', '3')));
	}

	@Test
	void rejectsValidWavSignatureWithMp3Extension() {
		byte[] wavHeader = new byte[] {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'A', 'V', 'E'};

		assertInvalidAudio(new MockMultipartFile(
				"file", "source.mp3", "audio/mpeg", wavHeader));
	}

	private void assertInvalidAudio(MockMultipartFile file) {
		assertThatThrownBy(() -> adapter.store(42L, file))
				.isInstanceOf(AudioStorageException.class)
				.hasMessage("File audio không hợp lệ.");
	}

	private byte[] audioBytes(int size, char... header) {
		byte[] bytes = new byte[size];
		for (int index = 0; index < header.length; index++) {
			bytes[index] = (byte) header[index];
		}
		return bytes;
	}
}
