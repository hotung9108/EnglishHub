package com.english_hub.core.modules.grading.infrastructure.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiAnnotationDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiWritingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.CriteriaScoresDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.FluencyMetricsDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.TextMetricsDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.WritingCriteriaScoresDto;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageConversionException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

class AiServiceClientTest {

	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@Test
	void serializeRequest_producesValidCamelCaseJson() throws Exception {
		AiSpeakingAnalysisRequest request = new AiSpeakingAnalysisRequest(
				101L,
				"https://example.com/audio.wav",
				null,
				"submissions/101/audio.wav",
				"Talk about hobbies",
				"Band 7 rubric",
				9.0
		);

		String json = objectMapper.writeValueAsString(request);
		JsonNode tree = objectMapper.readTree(json);

		assertThat(tree.get("submissionModuleId").asLong()).isEqualTo(101L);
		assertThat(tree.get("audioUrl").asText()).isEqualTo("https://example.com/audio.wav");
		assertThat(tree.has("audioBase64")).isFalse(); // non-null exclusion
		assertThat(tree.get("audioStorageKey").asText()).isEqualTo("submissions/101/audio.wav");
		assertThat(tree.get("maxScore").asDouble()).isEqualTo(9.0);
	}

	@Test
	void deserializeResponse_matchesPythonFastApiContract() throws Exception {
		String jsonResponse = """
				{
				  "submissionModuleId": 101,
				  "overallScore": 7.0,
				  "aiFeedback": "Fluent speech with clear coherence.",
				  "aiTranscript": [
				    { "word": "Hello", "start": 0.0, "end": 0.5, "confidence": 0.95 },
				    { "word": "world", "start": 0.5, "end": 1.0, "confidence": 0.92 }
				  ],
				  "fluencyMetrics": {
				    "wordsPerMinute": 130.5,
				    "pauseCount": 3,
				    "totalDurationSeconds": 45.0,
				    "phonationTimeRatio": 0.82
				  },
				  "criteriaScores": {
				    "fluencyAndCoherence": 7.0,
				    "lexicalResource": 7.5,
				    "grammaticalRangeAndAccuracy": 7.0,
				    "pronunciation": 6.5,
				    "overallScore": 7.0
				  },
				  "annotations": [
				    {
				      "startOffset": 0,
				      "endOffset": 5,
				      "errorType": "pronunciation",
				      "comment": "Good intonation",
				      "suggestedFix": null
				    }
				  ]
				}
				""";

		AiSpeakingAnalysisResponse response = objectMapper.readValue(jsonResponse, AiSpeakingAnalysisResponse.class);

		assertThat(response.submissionModuleId()).isEqualTo(101L);
		assertThat(response.overallScore()).isEqualTo(7.0);
		assertThat(response.aiFeedback()).isEqualTo("Fluent speech with clear coherence.");
		assertThat(response.aiTranscript()).isNotNull();
		assertThat(response.aiTranscript().isArray()).isTrue();
		assertThat(response.aiTranscript().size()).isEqualTo(2);
		assertThat(response.fluencyMetrics().wordsPerMinute()).isEqualTo(130.5);
		assertThat(response.criteriaScores().pronunciation()).isEqualTo(6.5);
		assertThat(response.annotations()).hasSize(1);
		assertThat(response.annotations().getFirst().comment()).isEqualTo("Good intonation");
	}

	@Test
	void serializeRequest_withCustomModelAndProvider_producesValidCamelCaseJson() throws Exception {
		AiSpeakingAnalysisRequest request = new AiSpeakingAnalysisRequest(
				102L,
				"https://example.com/audio2.wav",
				null,
				"submissions/102/audio.wav",
				"Talk about travel",
				"Band 8 rubric",
				9.0,
				"google/gemini-2.5-flash",
				"openrouter"
		);

		String json = objectMapper.writeValueAsString(request);
		JsonNode tree = objectMapper.readTree(json);

		assertThat(tree.get("submissionModuleId").asLong()).isEqualTo(102L);
		assertThat(tree.get("model").asText()).isEqualTo("google/gemini-2.5-flash");
		assertThat(tree.get("aiProvider").asText()).isEqualTo("openrouter");
	}

	@Test
	void deserializeResponse_withModelUsedAndProviderUsed_populatesFields() throws Exception {
		String jsonResponse = """
				{
				  "submissionModuleId": 102,
				  "overallScore": 8.0,
				  "aiFeedback": "Excellent speech.",
				  "aiTranscript": [],
				  "fluencyMetrics": {
				    "wordsPerMinute": 140.0,
				    "pauseCount": 2,
				    "totalDurationSeconds": 30.0,
				    "phonationTimeRatio": 0.85
				  },
				  "criteriaScores": {
				    "fluencyAndCoherence": 8.0,
				    "lexicalResource": 8.0,
				    "grammaticalRangeAndAccuracy": 8.0,
				    "pronunciation": 8.0,
				    "overallScore": 8.0
				  },
				  "annotations": [],
				  "modelUsed": "anthropic/claude-3.5-sonnet",
				  "providerUsed": "openrouter"
				}
				""";

		AiSpeakingAnalysisResponse response = objectMapper.readValue(jsonResponse, AiSpeakingAnalysisResponse.class);

		assertThat(response.modelUsed()).isEqualTo("anthropic/claude-3.5-sonnet");
		assertThat(response.providerUsed()).isEqualTo("openrouter");
	}

	@Test
	void serializeWritingRequest_producesValidCamelCaseJson() throws Exception {
		AiWritingAnalysisRequest request = new AiWritingAnalysisRequest(
				201L,
				"Nowadays, community service should be compulsory.",
				"Write an essay about community service",
				"IELTS Band 7 rubric",
				9.0,
				"google/gemini-2.5-flash",
				"openrouter"
		);

		String json = objectMapper.writeValueAsString(request);
		JsonNode tree = objectMapper.readTree(json);

		assertThat(tree.get("submissionModuleId").asLong()).isEqualTo(201L);
		assertThat(tree.get("content").asText()).isEqualTo("Nowadays, community service should be compulsory.");
		assertThat(tree.get("moduleInstructions").asText()).isEqualTo("Write an essay about community service");
		assertThat(tree.get("aiInstructionSnapshot").asText()).isEqualTo("IELTS Band 7 rubric");
		assertThat(tree.get("maxScore").asDouble()).isEqualTo(9.0);
		assertThat(tree.get("model").asText()).isEqualTo("google/gemini-2.5-flash");
		assertThat(tree.get("aiProvider").asText()).isEqualTo("openrouter");
	}

	@Test
	void deserializeWritingResponse_matchesPythonFastApiContract() throws Exception {
		String jsonResponse = """
				{
				  "submissionModuleId": 201,
				  "overallScore": 6.5,
				  "aiFeedback": "Good coherence and clear argumentation.",
				  "criteriaScores": {
				    "taskResponse": 7.0,
				    "coherenceAndCohesion": 6.5,
				    "lexicalResource": 6.0,
				    "grammaticalRangeAndAccuracy": 6.5,
				    "overallScore": 6.5
				  },
				  "textMetrics": {
				    "wordCount": 150,
				    "sentenceCount": 7,
				    "averageSentenceLength": 21.4,
				    "lexicalDiversity": 0.62,
				    "fleschKincaidGrade": 10.5
				  },
				  "annotations": [
				    {
				      "startOffset": 240,
				      "endOffset": 272,
				      "exactText": "Community service help teenagers",
				      "errorType": "GRAMMAR",
				      "comment": "Chủ ngữ số ít cần chia động từ",
				      "suggestedFix": "Community service helps teenagers"
				    }
				  ],
				  "modelUsed": "google/gemini-2.5-flash",
				  "providerUsed": "openrouter"
				}
				""";

		AiWritingAnalysisResponse response = objectMapper.readValue(jsonResponse, AiWritingAnalysisResponse.class);

		assertThat(response.submissionModuleId()).isEqualTo(201L);
		assertThat(response.overallScore()).isEqualTo(6.5);
		assertThat(response.aiFeedback()).isEqualTo("Good coherence and clear argumentation.");
		assertThat(response.criteriaScores().taskResponse()).isEqualTo(7.0);
		assertThat(response.criteriaScores().coherenceAndCohesion()).isEqualTo(6.5);
		assertThat(response.textMetrics().wordCount()).isEqualTo(150);
		assertThat(response.textMetrics().lexicalDiversity()).isEqualTo(0.62);
		assertThat(response.annotations()).hasSize(1);
		assertThat(response.annotations().getFirst().exactText()).isEqualTo("Community service help teenagers");
		assertThat(response.annotations().getFirst().errorType()).isEqualTo("GRAMMAR");
		assertThat(response.modelUsed()).isEqualTo("google/gemini-2.5-flash");
		assertThat(response.providerUsed()).isEqualTo("openrouter");
	}

	@Test
	void deserializeMissingCriteriaOverallScoreAsNull() throws Exception {
		String jsonResponse = """
				{
				  "submissionModuleId": 205,
				  "overallScore": 7.0,
				  "aiFeedback": "Feedback",
				  "criteriaScores": {
				    "taskResponse": 7.0,
				    "coherenceAndCohesion": 7.0,
				    "lexicalResource": 7.0,
				    "grammaticalRangeAndAccuracy": 7.0
				  }
				}
				""";

		AiWritingAnalysisResponse response = objectMapper.readValue(jsonResponse, AiWritingAnalysisResponse.class);

		assertThat(response.criteriaScores()).isNotNull();
		assertThat(response.criteriaScores().overallScore()).isNull();
	}

	@Test
	void retriesTimeoutThreeAttemptsWithOneAndTwoSecondBackoff() {
		List<Long> backoffs = new ArrayList<>();
		AtomicInteger attempts = new AtomicInteger();
		ResourceAccessException timeout = new ResourceAccessException("read timed out");
		AiServiceClientImpl client = client(backoffs);

		assertThatThrownBy(() -> client.executeWithRetry("timeout-test", () -> {
			attempts.incrementAndGet();
			throw timeout;
		})).isSameAs(timeout);

		assertThat(attempts).hasValue(3);
		assertThat(backoffs).containsExactly(1000L, 2000L);
	}

	@Test
	void retriesServerErrorsAndReturnsSuccessfulResponse() {
		List<Long> backoffs = new ArrayList<>();
		AtomicInteger attempts = new AtomicInteger();
		HttpServerErrorException serverError = new HttpServerErrorException(HttpStatus.BAD_GATEWAY);
		AiServiceClientImpl client = client(backoffs);

		String result = client.executeWithRetry("server-error-test", () -> {
			if (attempts.incrementAndGet() < 3) {
				throw serverError;
			}
			return "ok";
		});

		assertThat(result).isEqualTo("ok");
		assertThat(attempts).hasValue(3);
		assertThat(backoffs).containsExactly(1000L, 2000L);
	}

	@Test
	void doesNotRetryClientErrorsOrResponseDeserializationErrors() {
		List<Long> backoffs = new ArrayList<>();
		AtomicInteger clientErrorAttempts = new AtomicInteger();
		AtomicInteger conversionErrorAttempts = new AtomicInteger();
		HttpClientErrorException clientError = new HttpClientErrorException(HttpStatus.UNPROCESSABLE_ENTITY);
		HttpMessageConversionException conversionError = new HttpMessageConversionException("invalid response");
		AiServiceClientImpl client = client(backoffs);

		assertThatThrownBy(() -> client.executeWithRetry("client-error-test", () -> {
			clientErrorAttempts.incrementAndGet();
			throw clientError;
		})).isSameAs(clientError);
		assertThatThrownBy(() -> client.executeWithRetry("conversion-error-test", () -> {
			conversionErrorAttempts.incrementAndGet();
			throw conversionError;
		})).isSameAs(conversionError);

		assertThat(clientErrorAttempts).hasValue(1);
		assertThat(conversionErrorAttempts).hasValue(1);
		assertThat(backoffs).isEmpty();
	}

	private AiServiceClientImpl client(List<Long> backoffs) {
		return new AiServiceClientImpl("http://localhost:8001", 1, 1, backoffs::add);
	}
}

