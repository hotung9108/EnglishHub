package com.english_hub.core.modules.submission.infrastructure.storage;

import com.english_hub.core.modules.submission.application.port.StorageService;

import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * S3-compatible storage adapter built on the AWS SDK v2. Works against any
 * provider exposing the S3 API (Cloudflare R2, NeonDB Storage, MinIO, AWS S3)
 * via {@link StorageProperties} - only the credentials/config differ.
 */
public class S3StorageService implements StorageService, AutoCloseable {

	private static final Duration PRESIGN_TTL = Duration.ofMinutes(15);

	private final S3Client s3Client;
	private final S3Presigner s3Presigner;
	private final String bucket;

	public S3StorageService(StorageProperties properties) {
		this.bucket = properties.getBucket();
		URI endpoint = URI.create(properties.getEndpoint());
		S3Configuration s3Configuration = S3Configuration.builder()
				.pathStyleAccessEnabled(properties.isPathStyle())
				.build();
		StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(
				AwsBasicCredentials.create(properties.getAccessKeyId(), properties.getSecretAccessKey()));
		Region region = Region.of(properties.getRegion());
		this.s3Client = S3Client.builder()
				.endpointOverride(endpoint)
				.region(region)
				.credentialsProvider(credentialsProvider)
				.serviceConfiguration(s3Configuration)
				.build();
		this.s3Presigner = S3Presigner.builder()
				.endpointOverride(endpoint)
				.region(region)
				.credentialsProvider(credentialsProvider)
				.serviceConfiguration(s3Configuration)
				.build();
	}

	@Override
	public PresignedUpload generatePresignedPutUrl(String storageKey, String contentType) {
		PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(PutObjectPresignRequest.builder()
				.signatureDuration(PRESIGN_TTL)
				.putObjectRequest(putObject -> putObject
						.bucket(bucket)
						.key(storageKey)
						.contentType(contentType))
				.build());
		return new PresignedUpload(
				presigned.url().toString(),
				storageKey,
				OffsetDateTime.ofInstant(presigned.expiration(), ZoneOffset.UTC));
	}

	@Override
	public boolean objectExists(String storageKey) {
		try {
			s3Client.headObject(HeadObjectRequest.builder().bucket(bucket).key(storageKey).build());
			return true;
		} catch (NoSuchKeyException exception) {
			return false;
		} catch (S3Exception exception) {
			if (exception.statusCode() == 404) {
				return false;
			}
			throw exception;
		}
	}

	@Override
	public void close() {
		s3Presigner.close();
		s3Client.close();
	}
}