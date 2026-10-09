package com.english_hub.core.modules.grading.infrastructure.client;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;
import java.time.Duration;
import java.util.function.Supplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class AiServiceClientImpl implements AiServiceClient {

	private static final Logger LOGGER = LoggerFactory.getLogger(AiServiceClientImpl.class);
	private static final int MAX_ATTEMPTS = 3;
	private static final long INITIAL_BACKOFF_MILLIS = 1000;

	private final RestClient restClient;
	private final Sleeper sleeper;

	@Autowired
	public AiServiceClientImpl(
			@Value("${app.ai-service.base-url:http://localhost:8001}") String baseUrl,
			@Value("${app.ai-service.connect-timeout-seconds:5}") int connectTimeout,
			@Value("${app.ai-service.read-timeout-seconds:60}") int readTimeout) {
		this(baseUrl, connectTimeout, readTimeout, Thread::sleep);
	}

	AiServiceClientImpl(String baseUrl, int connectTimeout, int readTimeout, Sleeper sleeper) {
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(connectTimeout));
		requestFactory.setReadTimeout(Duration.ofSeconds(readTimeout));

		this.restClient = RestClient.builder()
				.baseUrl(baseUrl)
				.requestFactory(requestFactory)
				.build();
		this.sleeper = sleeper;
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

	<T> T executeWithRetry(String operationName, Supplier<T> action) {
		long backoffMs = INITIAL_BACKOFF_MILLIS;
		for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
			try {
				LOGGER.info("Calling AI service for {} (attempt {}/{})...", operationName, attempt, MAX_ATTEMPTS);
				return action.get();
			} catch (RuntimeException exception) {
				if (!isRetryable(exception) || attempt == MAX_ATTEMPTS) {
					LOGGER.warn(
							"AI service call for {} failed without another retry: {}",
							operationName,
							exception.getClass().getSimpleName());
					throw exception;
				}
				LOGGER.warn(
						"Attempt {} to call AI service for {} failed with {}; retrying",
						attempt,
						operationName,
						exception.getClass().getSimpleName());
				try {
					sleeper.sleep(backoffMs);
					backoffMs *= 2;
				} catch (InterruptedException interrupted) {
					Thread.currentThread().interrupt();
					throw new IllegalStateException("AI service retry was interrupted.", interrupted);
				}
			}
		}
		throw new IllegalStateException("AI service retry loop ended unexpectedly.");
	}

	private boolean isRetryable(RuntimeException exception) {
		return exception instanceof ResourceAccessException
				|| (exception instanceof RestClientResponseException responseException
						&& responseException.getStatusCode().is5xxServerError());
	}

	@FunctionalInterface
	interface Sleeper {
		void sleep(long milliseconds) throws InterruptedException;
	}
}
