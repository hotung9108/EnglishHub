package com.english_hub.core.modules.grading.infrastructure.client;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;
import java.time.Duration;
import java.util.function.Supplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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
		return executeWithRetry("analyze speaking", () ->
				restClient.post()
						.uri("/api/v1/analyze/speaking")
						.contentType(MediaType.APPLICATION_JSON)
						.body(request)
						.retrieve()
						.body(AiSpeakingAnalysisResponse.class)
		);
	}

	@Override
	public AiWritingAnalysisResponse analyzeWriting(AiWritingAnalysisRequest request) {
		return executeWithRetry("analyze writing", () ->
				restClient.post()
						.uri("/api/v1/analyze/writing")
						.contentType(MediaType.APPLICATION_JSON)
						.body(request)
						.retrieve()
						.body(AiWritingAnalysisResponse.class)
		);
	}

	@Override
	public AiWritingAnalysisResponse analyzeWritingUpload(
			long submissionModuleId,
			Resource documentFile,
			String filename,
			String moduleInstructions,
			String aiInstructionSnapshot,
			Double maxScore,
			String model,
			String aiProvider) {
		MultiValueMap<String, Object> parts = new LinkedMultiValueMap<>();
		parts.add("file", documentFile);
		parts.add("submissionModuleId", String.valueOf(submissionModuleId));
		if (moduleInstructions != null && !moduleInstructions.isBlank()) {
			parts.add("moduleInstructions", moduleInstructions);
		}
		if (aiInstructionSnapshot != null && !aiInstructionSnapshot.isBlank()) {
			parts.add("aiInstructionSnapshot", aiInstructionSnapshot);
		}
		if (maxScore != null) {
			parts.add("maxScore", String.valueOf(maxScore));
		}
		if (model != null && !model.isBlank()) {
			parts.add("model", model);
		}
		if (aiProvider != null && !aiProvider.isBlank()) {
			parts.add("aiProvider", aiProvider);
		}

		return executeWithRetry("analyze writing upload (" + filename + ")", () ->
				restClient.post()
						.uri("/api/v1/analyze/writing/upload")
						.contentType(MediaType.MULTIPART_FORM_DATA)
						.body(parts)
						.retrieve()
						.body(AiWritingAnalysisResponse.class)
		);
	}

	private <T> T executeWithRetry(String operationName, Supplier<T> action) {
		int attempt = 0;
		long backoffMs = 1000;
		Exception lastException = null;

		while (attempt <= MAX_RETRIES) {
			try {
				attempt++;
				LOGGER.info("Calling AI service for {} (attempt {}/{})...", operationName, attempt, MAX_RETRIES + 1);
				return action.get();
			} catch (Exception ex) {
				lastException = ex;
				LOGGER.warn("Attempt {} to call AI service for {} failed: {}", attempt, operationName, ex.getMessage());
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

		throw new RuntimeException("AI service call for " + operationName + " failed after " + (MAX_RETRIES + 1) + " attempts", lastException);
	}
}
