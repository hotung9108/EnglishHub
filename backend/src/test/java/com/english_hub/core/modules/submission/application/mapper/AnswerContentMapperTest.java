package com.english_hub.core.modules.submission.application.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.grading.domain.service.AnswerComparator;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class AnswerContentMapperTest {

	private static final JsonMapper JSON = new JsonMapper();
	private static final TypeReference<Map<String, Object>> CONTENT_TYPE = new TypeReference<>() {};

	@ParameterizedTest(name = "{0}")
	@MethodSource("contentCases")
	void mapsOnlyRootKeys(String description, String input, String expected) {
		assertMapping(input, expected);
	}

	@ParameterizedTest(name = "{0}: {1}")
	@MethodSource("conflictingKeys")
	void resolvesConflictsWithoutChangingComparison(String apiKey, String input, String expected) {
		JsonNode result = assertMapping(input, expected);
		if (apiKey.equals("isCorrect")) {
			return;
		}
		QuestionType type = apiKey.equals("text") ? QuestionType.SHORT_ANSWER : QuestionType.MULTIPLE_CHOICE;
		Map<String, Object> correctAnswer = type == QuestionType.SHORT_ANSWER
				? Map.of("correctAnswer", "English")
				: Map.of("options", List.of(Map.of("id", 1, "isCorrect", true)));
		Map<String, Object> raw = JSON.readValue(input, CONTENT_TYPE);
		Map<String, Object> normalized = JSON.convertValue(result, CONTENT_TYPE);

		assertThat(AnswerComparator.matches(type, normalized, correctAnswer))
				.isEqualTo(AnswerComparator.matches(type, raw, correctAnswer));
	}

	private JsonNode assertMapping(String inputJson, String expectedJson) {
		JsonNode input = inputJson == null ? null : JSON.readTree(inputJson);
		JsonNode before = input == null ? null : input.deepCopy();
		JsonNode expected = expectedJson == null ? null : JSON.readTree(expectedJson);

		JsonNode result = AnswerContentMapper.toResponse(input);

		assertThat(result).isEqualTo(expected);
		assertThat(input).isEqualTo(before);
		assertThat(AnswerContentMapper.toResponse(result)).isEqualTo(result);
		if (input != null && input.isContainer()) {
			assertThat(result).isNotSameAs(input);
		}
		return result;
	}

	static Stream<Arguments> contentCases() {
		return Stream.of(
				Arguments.of("legacy MC", "{\"selected_option_ids\":[1],\"is_correct\":true,\"score\":1.0}",
						"{\"selectedOptionIds\":[1],\"isCorrect\":true,\"score\":1.0}"),
				Arguments.of("camelCase MC", "{\"selectedOptionIds\":[1],\"isCorrect\":true,\"score\":1.0}",
						"{\"selectedOptionIds\":[1],\"isCorrect\":true,\"score\":1.0}"),
				Arguments.of("multiple selections keep order", "{\"selected_option_ids\":[3,1,2]}",
						"{\"selectedOptionIds\":[3,1,2]}"),
				Arguments.of("empty selection", "{\"selected_option_ids\":[]}", "{\"selectedOptionIds\":[]}"),
				Arguments.of("legacy SA", "{\"answer_text\":\"x\",\"is_correct\":false,\"score\":0}",
						"{\"text\":\"x\",\"isCorrect\":false,\"score\":0}"),
				Arguments.of("camelCase SA", "{\"text\":\"x\",\"isCorrect\":false,\"score\":0}",
						"{\"text\":\"x\",\"isCorrect\":false,\"score\":0}"),
				Arguments.of("ungraded MC", "{\"selected_option_ids\":[1]}", "{\"selectedOptionIds\":[1]}"),
				Arguments.of("ungraded SA", "{\"answer_text\":\"x\"}", "{\"text\":\"x\"}"),
				Arguments.of("Unicode and escapes", "{\"answer_text\":\"Tiếng Việt \\\"đúng\\\"\\n答え\"}",
						"{\"text\":\"Tiếng Việt \\\"đúng\\\"\\n答え\"}"),
				Arguments.of("legacy null verdict", "{\"is_correct\":null}", "{\"isCorrect\":null}"),
				Arguments.of("legacy null selection", "{\"selected_option_ids\":null}", "{\"selectedOptionIds\":null}"),
				Arguments.of("legacy null text", "{\"answer_text\":null}", "{\"text\":null}"),
				Arguments.of("string verdict", "{\"is_correct\":\"true\"}", "{\"isCorrect\":\"true\"}"),
				Arguments.of("canonical null without legacy", "{\"isCorrect\":null,\"selectedOptionIds\":null,\"text\":null}",
						"{\"isCorrect\":null,\"selectedOptionIds\":null,\"text\":null}"),
				Arguments.of("string", "\"{\\\"is_correct\\\":true}\"", "\"{\\\"is_correct\\\":true}\""),
				Arguments.of("number", "42", "42"),
				Arguments.of("boolean", "false", "false"),
				Arguments.of("array", "[{\"is_correct\":true}]", "[{\"is_correct\":true}]"),
				Arguments.of("JSON null", "null", "null"),
				Arguments.of("Java null", null, null),
				Arguments.of("empty object", "{}", "{}"),
				Arguments.of("unrelated and nested keys", "{\"unknown_key\":1,\"metadata\":{\"is_correct\":true,\"items\":[{\"answer_text\":\"x\"}]}}",
						"{\"unknown_key\":1,\"metadata\":{\"is_correct\":true,\"items\":[{\"answer_text\":\"x\"}]}}"));
	}

	static Stream<Arguments> conflictingKeys() {
		return Stream.of(
				new String[]{"is_correct", "isCorrect", "false", "true", "true"},
				new String[]{"is_correct", "isCorrect", "true", "false", "false"},
				new String[]{"is_correct", "isCorrect", "true", "null", "true"},
				new String[]{"is_correct", "isCorrect", "null", "null", "null"},
				new String[]{"selected_option_ids", "selectedOptionIds", "[2]", "[1]", "[1]"},
				new String[]{"selected_option_ids", "selectedOptionIds", "[1]", "null", "[1]"},
				new String[]{"selected_option_ids", "selectedOptionIds", "[1]", "[]", "[]"},
				new String[]{"selected_option_ids", "selectedOptionIds", "null", "null", "null"},
				new String[]{"answer_text", "text", "\"French\"", "\"English\"", "\"English\""},
				new String[]{"answer_text", "text", "\"English\"", "null", "\"English\""},
				new String[]{"answer_text", "text", "null", "null", "null"},
				new String[]{"answer_text", "text", "\"English\"", "\"\"", "\"\""},
				new String[]{"answer_text", "text", "\"English\"", "42", "42"},
				new String[]{"is_correct", "isCorrect", "false", "\"true\"", "\"true\""})
				.flatMap(values -> {
					String legacy = "\"" + values[0] + "\":" + values[2];
					String primary = "\"" + values[1] + "\":" + values[3];
					String expected = "{\"" + values[1] + "\":" + values[4] + "}";
					return Stream.of(
							Arguments.of(values[1], "{" + legacy + "," + primary + "}", expected),
							Arguments.of(values[1], "{" + primary + "," + legacy + "}", expected));
				});
	}
}
