package com.english_hub.core.infrastructure.email;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.email.EmailService;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * {@link EmailService} backed by the EmailJS REST API
 * ({@code POST https://api.emailjs.com/api/v1.0/email/send}).
 *
 * <p>Provider failures (unreachable host or non-2xx response) are surfaced as a
 * {@code 502 Bad Gateway} so the caller never reports a delivery that did not
 * happen.</p>
 */
public class EmailJsEmailService implements EmailService {

	private static final Logger LOGGER = LoggerFactory.getLogger(EmailJsEmailService.class);
	private static final String SEND_PATH = "/api/v1.0/email/send";
	private static final String DELIVERY_FAILED_MESSAGE =
			"Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.";

	private final EmailJsProperties properties;
	private final RestClient restClient;

	public EmailJsEmailService(EmailJsProperties properties) {
		this(properties, defaultRestClient(properties));
	}

	EmailJsEmailService(EmailJsProperties properties, RestClient restClient) {
		this.properties = properties;
		this.restClient = restClient;
	}

	private static RestClient defaultRestClient(EmailJsProperties properties) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
		requestFactory.setReadTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
		return RestClient.builder()
				.baseUrl(properties.getBaseUrl())
				.requestFactory(requestFactory)
				.build();
	}

	@Override
	public void sendPasswordResetOtp(String toEmail, String otp, String resetUrl, int ttlMinutes) {
		Map<String, Object> templateParams = new LinkedHashMap<>();
		templateParams.put("to_email", toEmail);
		templateParams.put("otp", otp);
		templateParams.put("reset_url", resetUrl);
		templateParams.put("ttl_minutes", ttlMinutes);

		EmailJsRequest body = new EmailJsRequest(
				properties.getServiceId(),
				properties.getPasswordResetTemplateId(),
				properties.getPublicKey(),
				properties.getPrivateKey(),
				templateParams);

		try {
			restClient.post()
					.uri(SEND_PATH)
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.toBodilessEntity();
		} catch (ResourceAccessException exception) {
			LOGGER.error("Could not reach EmailJS while sending a password reset email to [{}]", toEmail, exception);
			throw ApiException.badGateway(DELIVERY_FAILED_MESSAGE);
		} catch (RestClientResponseException exception) {
			LOGGER.error(
					"EmailJS rejected the password reset email for [{}] with status {}: {}",
					toEmail,
					exception.getStatusCode(),
					exception.getResponseBodyAsString());
			throw ApiException.badGateway(DELIVERY_FAILED_MESSAGE);
		}
	}

	/** Request payload of the EmailJS {@code /send} endpoint. */
	record EmailJsRequest(
			String service_id,
			String template_id,
			String user_id,
			String accessToken,
			Map<String, Object> template_params) {
	}
}
