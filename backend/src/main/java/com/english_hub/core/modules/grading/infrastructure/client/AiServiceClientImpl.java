package com.english_hub.core.modules.grading.infrastructure.client;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import java.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AiServiceClientImpl implements AiServiceClient {

	private static final Logger LOGGER = LoggerFactory.getLogger(AiServiceClientImpl.class);
	private static final int MAX_RETRIES = 2;

	private final RestClient restClient;

	public AiServiceClientImpl(
			@Value("${app.ai-service.base-url:http://localhost:8001}") String baseUrl,
			@Value("${app.ai-service.connect-timeout-seconds:5}") int connectTimeout,
			@Value("${app.ai-service.read-timeout-seconds:60}") int readTimeout) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(connectTimeout));
		requestFactory.setReadTimeout(Duration.ofSeconds(readTimeout));

		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(requestFactory)
				.build();
	}

	@Override
	public AiSpeakingAnalysisResponse analyzeSpeaking(AiSpeakingAnalysisRequest request) {
		int attempt = 0;
		long backoffMs = 1000;
		Exception lastException = null;

		while (attempt <= MAX_RETRIES) {
			try {
				attempt++;
				LOGGER.info("Calling AI service analyze speaking endpoint (attempt {}/{})...", attempt, MAX_RETRIES + 1);
				return restClient.post()
						.uri("/api/v1/analyze/speaking")
						.contentType(MediaType.APPLICATION_JSON)
						.body(request)
						.retrieve()
						.body(AiSpeakingAnalysisResponse.class);
			} catch (Exception ex) {
				lastException = ex;
				LOGGER.warn("Attempt {} to call AI service failed: {}", attempt, ex.getMessage());
				if (attempt <= MAX_RETRIES) {
					try {
						Thread.sleep(backoffMs);
						backoffMs *= 2;
					} catch (InterruptedException ie) {
						Thread.currentThread().interrupt();
						throw new RuntimeException("AI service call interrupted", ie);
					}
				}
			}
		}

		throw new RuntimeException("AI service call failed after " + (MAX_RETRIES + 1) + " attempts", lastException);
	}
}
