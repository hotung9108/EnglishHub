package com.english_hub.core.infrastructure.email;

import com.english_hub.core.common.email.EmailService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(EmailJsProperties.class)
public class EmailConfiguration {

	@Bean
	@ConditionalOnProperty(name = "app.email.enabled", havingValue = "true")
	public EmailService emailJsEmailService(EmailJsProperties properties) {
		return new EmailJsEmailService(properties);
	}

	@Bean
	@ConditionalOnMissingBean(EmailService.class)
	public EmailService unavailableEmailService() {
		return new UnavailableEmailService();
	}
}
