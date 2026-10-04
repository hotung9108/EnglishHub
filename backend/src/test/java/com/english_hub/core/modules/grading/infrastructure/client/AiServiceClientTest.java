package com.english_hub.core.modules.grading.infrastructure.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.grading.infrastructure.client.dto.AiAnnotationDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisRequest;
import com.english_hub.core.modules.grading.infrastructure.client.dto.AiSpeakingAnalysisResponse;
import com.english_hub.core.modules.grading.infrastructure.client.dto.CriteriaScoresDto;
import com.english_hub.core.modules.grading.infrastructure.client.dto.FluencyMetricsDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class AiServiceClientTest {

	private final ObjectMapper objectMapper = new ObjectMapper();

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
}
