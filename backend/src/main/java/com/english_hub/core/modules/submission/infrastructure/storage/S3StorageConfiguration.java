package com.english_hub.core.modules.submission.infrastructure.storage;

import com.english_hub.core.modules.submission.application.port.StorageService;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(StorageProperties.class)
public class S3StorageConfiguration {

	@Bean
	@ConditionalOnProperty(name = "app.storage.s3.enabled", havingValue = "true")
	public StorageService s3StorageService(StorageProperties properties) {
		return new S3StorageService(properties);
	}

	@Bean
	@ConditionalOnMissingBean(StorageService.class)
	public StorageService unavailableStorageService() {
		return new UnavailableStorageService();
	}
}