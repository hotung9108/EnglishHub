package com.english_hub.core.modules.submission.infrastructure.storage;

import com.english_hub.core.modules.submission.application.port.StorageService.PresignedUpload;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * [OPS-43] Integration test verifying audio upload (Speaking & Listening)
 * using a real MinIO container with a persistent volume, ensuring data
 * durability and SHA-256 checksum integrity after container restart.
 */
class MinioAudioStorageIntegrationTest {

	private static final String MINIO_IMAGE = "cgr.dev/chainguard/minio:latest";
	private static final String BUCKET = "englishhub-audio-durability-test";
	private static final String ACCESS_KEY = "minioadmin";
	private static final String SECRET_KEY = "minioadmin";
	private static final int MINIO_PORT = 9000;

	private GenericContainer<?> minioContainer;
	private S3StorageService storageService;

	@TempDir
	Path persistentDataDir;

	@AfterEach
	void tearDown() {
		if (storageService != null) {
			storageService.close();
		}
		if (minioContainer != null && minioContainer.isRunning()) {
			try {
				minioContainer.execInContainer("chmod", "-R", "777", "/data");
			} catch (Exception ignored) {
			}
			minioContainer.stop();
		}
	}

	private GenericContainer<?> createMinioContainer(Path dataDir) {
		try {
			Files.setPosixFilePermissions(dataDir, PosixFilePermissions.fromString("rwxrwxrwx"));
		} catch (Exception ignored) {
		}
		return new GenericContainer<>(MINIO_IMAGE)
				.withCreateContainerCmdModifier(cmd -> cmd.withUser("0:0"))
				.withEnv("MINIO_ROOT_USER", ACCESS_KEY)
				.withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
				.withCommand("server", "/data")
				.withFileSystemBind(dataDir.toAbsolutePath().toString(), "/data", BindMode.READ_WRITE)
				.withExposedPorts(MINIO_PORT)
				.waitingFor(Wait.forHttp("/minio/health/ready")
						.forStatusCode(200)
						.withStartupTimeout(Duration.ofMinutes(2)));
	}

	private void createBucketIfNotExists(String endpoint) {
		try (S3Client client = S3Client.builder()
				.endpointOverride(URI.create(endpoint))
				.region(Region.US_EAST_1)
				.credentialsProvider(StaticCredentialsProvider.create(
						AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
				.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
				.build()) {
			client.createBucket(b -> b.bucket(BUCKET));
		}
	}

	private S3StorageService createStorageService(String endpoint) {
		StorageProperties properties = new StorageProperties();
		properties.setEnabled(true);
		properties.setEndpoint(endpoint);
		properties.setRegion("us-east-1");
		properties.setAccessKeyId(ACCESS_KEY);
		properties.setSecretAccessKey(SECRET_KEY);
		properties.setBucket(BUCKET);
		properties.setPathStyle(true);
		return new S3StorageService(properties);
	}

	private static String sha256Hex(byte[] data) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(data));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm not available", e);
		}
	}

	private void uploadViaPresignedUrl(String uploadUrl, String contentType, byte[] payload)
			throws IOException, InterruptedException {
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(uploadUrl))
				.header("Content-Type", contentType)
				.PUT(HttpRequest.BodyPublishers.ofByteArray(payload))
				.build();
		HttpResponse<Void> response = HttpClient.newHttpClient()
				.send(request, HttpResponse.BodyHandlers.discarding());
		assertThat(response.statusCode() / 100)
				.as("Presigned PUT to %s must return 2xx status code", uploadUrl)
				.isEqualTo(2);
	}

	@Test
	@DisplayName("[OPS-43] Speaking & Listening audio upload persists across MinIO container restart with matching SHA-256 checksums")
	void audioUploads_persistAcrossMinioRestart_withMatchingChecksum() throws Exception {
		// 1. Khởi động MinIO lần 1 với persistent volume
		minioContainer = createMinioContainer(persistentDataDir);
		minioContainer.start();

		String endpoint1 = "http://" + minioContainer.getHost() + ":" + minioContainer.getMappedPort(MINIO_PORT);
		createBucketIfNotExists(endpoint1);
		storageService = createStorageService(endpoint1);

		// 2. Chuẩn bị payload Speaking audio (WebM) và Listening audio (MP3)
		byte[] speakingAudioPayload = "MOCK_WEBM_SPEAKING_RECORDING_DATA_FOR_OPS_43_CHECK_ABC123".getBytes();
		byte[] listeningAudioPayload = "MOCK_MP3_LISTENING_AUDIO_FILE_DATA_FOR_OPS_43_CHECK_XYZ789".getBytes();

		String speakingKey = "submissions/42/module-101/speaking_response.webm";
		String listeningKey = "modules/77/audio/listening_lecture.mp3";

		String initialSpeakingSha256 = sha256Hex(speakingAudioPayload);
		String initialListeningSha256 = sha256Hex(listeningAudioPayload);

		// 3. Upload Speaking audio qua Presigned PUT URL
		PresignedUpload speakingPresigned = storageService.generatePresignedPutUrl(speakingKey, "audio/webm");
		uploadViaPresignedUrl(speakingPresigned.uploadUrl(), "audio/webm", speakingAudioPayload);

		// 4. Upload Listening audio qua Presigned PUT URL
		PresignedUpload listeningPresigned = storageService.generatePresignedPutUrl(listeningKey, "audio/mpeg");
		uploadViaPresignedUrl(listeningPresigned.uploadUrl(), "audio/mpeg", listeningAudioPayload);

		// 5. Verify cả 2 file đã lưu thành công trước khi restart
		assertThat(storageService.objectExists(speakingKey)).isTrue();
		assertThat(storageService.objectExists(listeningKey)).isTrue();
		assertThat(sha256Hex(storageService.getObjectBytes(speakingKey))).isEqualTo(initialSpeakingSha256);
		assertThat(sha256Hex(storageService.getObjectBytes(listeningKey))).isEqualTo(initialListeningSha256);

		// 6. Dừng MinIO container (giả lập crash/restart server)
		storageService.close();
		minioContainer.stop();

		// 7. Khởi động container MinIO mới gắn cùng persistent directory
		minioContainer = createMinioContainer(persistentDataDir);
		minioContainer.start();

		String endpoint2 = "http://" + minioContainer.getHost() + ":" + minioContainer.getMappedPort(MINIO_PORT);
		storageService = createStorageService(endpoint2);

		// 8. Đọc lại và verify checksum sau khi restart
		assertThat(storageService.objectExists(speakingKey))
				.as("Speaking audio must persist after MinIO restart")
				.isTrue();
		assertThat(storageService.objectExists(listeningKey))
				.as("Listening audio must persist after MinIO restart")
				.isTrue();

		byte[] retrievedSpeaking = storageService.getObjectBytes(speakingKey);
		byte[] retrievedListening = storageService.getObjectBytes(listeningKey);

		assertThat(retrievedSpeaking).isNotNull();
		assertThat(retrievedListening).isNotNull();

		assertThat(sha256Hex(retrievedSpeaking))
				.as("Speaking audio SHA-256 checksum after restart must match original")
				.isEqualTo(initialSpeakingSha256);

		assertThat(sha256Hex(retrievedListening))
				.as("Listening audio SHA-256 checksum after restart must match original")
				.isEqualTo(initialListeningSha256);
	}
}
