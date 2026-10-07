package com.english_hub.core.modules.submission.infrastructure.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for a provider-agnostic, S3-compatible object store
 * (Cloudflare R2, NeonDB Storage, MinIO, AWS S3, ...). Switching provider
 * only requires changing these values.
 */
@ConfigurationProperties(prefix = "app.storage.s3")
public class StorageProperties {

	private boolean enabled;

	private String endpoint;

	private String region = "auto";

	private String accessKeyId;

	private String secretAccessKey;

	private String bucket;

	private boolean pathStyle = true;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public void setEndpoint(String endpoint) {
		this.endpoint = endpoint;
	}

	public String getRegion() {
		return region;
	}

	public void setRegion(String region) {
		this.region = region;
	}

	public String getAccessKeyId() {
		return accessKeyId;
	}

	public void setAccessKeyId(String accessKeyId) {
		this.accessKeyId = accessKeyId;
	}

	public String getSecretAccessKey() {
		return secretAccessKey;
	}

	public void setSecretAccessKey(String secretAccessKey) {
		this.secretAccessKey = secretAccessKey;
	}

	public String getBucket() {
		return bucket;
	}

	public void setBucket(String bucket) {
		this.bucket = bucket;
	}

	public boolean isPathStyle() {
		return pathStyle;
	}

	public void setPathStyle(boolean pathStyle) {
		this.pathStyle = pathStyle;
	}
}