package com.english_hub.core.modules.submission.infrastructure.storage;

import com.english_hub.core.modules.submission.application.port.StorageService.PresignedUpload;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class S3StorageServiceIntegrationTest {

	private static final String BUCKET = "englishhub-test";
	private static final String ACCESS_KEY = "minioadmin";
	private static final String SECRET_KEY = "minioadmin";
	private static final byte[] PAYLOAD = "phase-7-storage-payload".getBytes();

	@Container
	static final GenericContainer<?> MINIO = new GenericContainer<>("quay.io/minio/minio:latest")
			.withEnv("MINIO_ROOT_USER", ACCESS_KEY)
			.withEnv("MINIO_ROOT_PASSWORD", SECRET_KEY)
			.withCommand("server /data --address :9000 --console-address :9001")
			.withExposedPorts(9000);

	static S3StorageService storageService;

	static String endpoint() {
		return "http://localhost:" + MINIO.getMappedPort(9000);
	}

	@BeforeAll
	static void setUp() {
		try (S3Client client = S3Client.builder()
				.endpointOverride(URI.create(endpoint()))
				.region(Region.US_EAST_1)
				.credentialsProvider(StaticCredentialsProvider.create(
						AwsBasicCredentials.create(ACCESS_KEY, SECRET_KEY)))
				.serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
				.build()) {
			client.createBucket(bucket -> bucket.bucket(BUCKET));
		}
		StorageProperties properties = new StorageProperties();
		properties.setEnabled(true);
		properties.setEndpoint(endpoint());
		properties.setRegion("us-east-1");
		properties.setAccessKeyId(ACCESS_KEY);
		properties.setSecretAccessKey(SECRET_KEY);
		properties.setBucket(BUCKET);
		properties.setPathStyle(true);
		storageService = new S3StorageService(properties);
	}

	@AfterAll
	static void tearDown() {
		storageService.close();
	}

	@Test
	void presignedPutUrl_hasExpectedShape_andAllowsDirectUpload() throws Exception {
		PresignedUpload upload = storageService.generatePresignedPutUrl(
				"submissions/88/module-150/audio.webm", "audio/webm");

		assertThat(upload.storageKey()).isEqualTo("submissions/88/module-150/audio.webm");
		assertThat(upload.uploadUrl()).contains(endpoint());
		assertThat(upload.uploadUrl()).contains("/englishhub-test/submissions/88/module-150/audio.webm");
		assertThat(upload.uploadUrl()).contains("X-Amz-Signature");
		OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
		assertThat(upload.expiresAt()).isBetween(now.plusMinutes(14), now.plusMinutes(16));

		assertThat(storageService.objectExists("submissions/88/module-150/audio.webm")).isFalse();

		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(upload.uploadUrl()))
				.header("Content-Type", "audio/webm")
				.PUT(HttpRequest.BodyPublishers.ofByteArray(PAYLOAD))
				.build();
		HttpResponse<Void> response = HttpClient.newHttpClient()
				.send(request, HttpResponse.BodyHandlers.discarding());

		assertThat(response.statusCode()).isBetween(200, 204);
		assertThat(storageService.objectExists("submissions/88/module-150/audio.webm")).isTrue();
	}

	@Test
	void objectExists_returnsFalse_forMissingKey() {
		assertThat(storageService.objectExists("submissions/1/module-2/essay.pdf")).isFalse();
	}
}