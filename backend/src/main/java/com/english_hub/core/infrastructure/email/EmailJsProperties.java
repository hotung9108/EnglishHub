package com.english_hub.core.infrastructure.email;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the EmailJS REST provider. The EmailJS dashboard exposes
 * the service/template identifiers and the public/private keys; the private
 * key must only ever be supplied through the environment.
 */
@ConfigurationProperties(prefix = "app.email.emailjs")
public class EmailJsProperties {

	private String baseUrl = "https://api.emailjs.com";

	private String serviceId;

	private String passwordResetTemplateId;

	private String publicKey;

	private String privateKey;

	private int timeoutSeconds = 10;

	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String getServiceId() {
		return serviceId;
	}

	public void setServiceId(String serviceId) {
		this.serviceId = serviceId;
	}

	public String getPasswordResetTemplateId() {
		return passwordResetTemplateId;
	}

	public void setPasswordResetTemplateId(String passwordResetTemplateId) {
		this.passwordResetTemplateId = passwordResetTemplateId;
	}

	public String getPublicKey() {
		return publicKey;
	}

	public void setPublicKey(String publicKey) {
		this.publicKey = publicKey;
	}

	public String getPrivateKey() {
		return privateKey;
	}

	public void setPrivateKey(String privateKey) {
		this.privateKey = privateKey;
	}

	public int getTimeoutSeconds() {
		return timeoutSeconds;
	}

	public void setTimeoutSeconds(int timeoutSeconds) {
		this.timeoutSeconds = timeoutSeconds;
	}
}
