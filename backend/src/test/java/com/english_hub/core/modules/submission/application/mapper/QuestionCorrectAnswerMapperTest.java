package com.english_hub.core.modules.submission.application.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.question.infrastructure.mapper.QuestionPersistenceMapper;
import com.english_hub.core.modules.submission.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class QuestionCorrectAnswerMapperTest {

	private static final JsonMapper JSON = new JsonMapper();
	private static final QuestionPersistenceMapper PERSISTENCE_MAPPER = new QuestionPersistenceMapper(JSON);

	@ParameterizedTest(name = "{0}")
	@MethodSource("answerCases")
	void normalizesOnlyContractPaths(String description, QuestionType type, String input, String expected) {
		assertMapping(type, input, expected);
	}

	@ParameterizedTest(name = "{0}: {1}")
	@MethodSource("conflictingKeys")
	void matchesPersistenceMapperWhenKeysConflict(QuestionType type, String input, String expected) {
		JsonNode result = assertMapping(type, input, expected);
		var entity = new com.english_hub.core.infrastructure.persistence.entity.Question(
				9L, "Question",
				com.english_hub.core.infrastructure.persistence.entity.QuestionType.valueOf(type.name()),
				input, BigDecimal.ONE, 1);

		JsonNode gradingCorrectAnswer = JSON.valueToTree(PERSISTENCE_MAPPER.toDomain(entity).correctAnswer());

		assertThat(result).isEqualTo(gradingCorrectAnswer);
	}

	private JsonNode assertMapping(QuestionType type, String inputJson, String expectedJson) {
		JsonNode input = inputJson == null ? null : JSON.readTree(inputJson);
		JsonNode before = input == null ? null : input.deepCopy();
		JsonNode expected = expectedJson == null ? null : JSON.readTree(expectedJson);

		JsonNode result = QuestionCorrectAnswerMapper.toResponse(type, input);

		assertThat(result).isEqualTo(expected);
		assertThat(input).isEqualTo(before);
		assertThat(QuestionCorrectAnswerMapper.toResponse(type, result)).isEqualTo(result);
		if (input != null && input.isContainer()) {
			assertThat(result).isNotSameAs(input);
		}
		return result;
	}

	static Stream<Arguments> answerCases() {
		return Stream.of(
				mc("legacy options keep ids and order",
						"{\"options\":[{\"id\":2,\"is_correct\":false},{\"id\":1,\"is_correct\":true}]}",
						"{\"options\":[{\"id\":2,\"isCorrect\":false},{\"id\":1,\"isCorrect\":true}]}"),
				mc("camelCase unchanged", "{\"options\":[{\"isCorrect\":true}]}",
						"{\"options\":[{\"isCorrect\":true}]}"),
				mc("multiple correct options", "{\"options\":[{\"is_correct\":true},{\"is_correct\":true}]}",
						"{\"options\":[{\"isCorrect\":true},{\"isCorrect\":true}]}"),
				sa("legacy object", "{\"correct_answer\":\"English\"}", "{\"correctAnswer\":\"English\"}"),
				sa("camelCase object", "{\"correctAnswer\":\"English\"}", "{\"correctAnswer\":\"English\"}"),
				sa("legacy string", "\"English\"", "{\"correctAnswer\":\"English\"}"),
				sa("empty string", "\"\"", "{\"correctAnswer\":\"\"}"),
				sa("Unicode and escapes", "\"Tiếng Việt \\\"đúng\\\"\\n答え\"",
						"{\"correctAnswer\":\"Tiếng Việt \\\"đúng\\\"\\n答え\"}"),
				sa("number", "42", "42"),
				sa("boolean", "false", "false"),
				sa("array", "[{\"correct_answer\":\"English\"}]", "[{\"correct_answer\":\"English\"}]"),
				sa("JSON null", "null", "null"),
				sa("Java null", null, null),
				sa("empty object", "{}", "{}"),
				sa("unrelated nested keys", "{\"correct_answer\":\"A\",\"metadata\":{\"correct_answer\":\"B\"},\"other_key\":1}",
						"{\"correctAnswer\":\"A\",\"metadata\":{\"correct_answer\":\"B\"},\"other_key\":1}"),
				mc("array root", "[{\"is_correct\":true}]", "[{\"is_correct\":true}]"),
				mc("string root", "\"A\"", "\"A\""),
				mc("number root", "1", "1"),
				mc("boolean root", "true", "true"),
				mc("JSON null", "null", "null"),
				mc("Java null", null, null),
				mc("missing options", "{}", "{}"),
				mc("null options", "{\"options\":null}", "{\"options\":null}"),
				mc("empty options", "{\"options\":[]}", "{\"options\":[]}"),
				mc("object options", "{\"options\":{\"is_correct\":true}}", "{\"options\":{\"is_correct\":true}}"),
				mc("scalar options", "{\"options\":\"legacy\"}", "{\"options\":\"legacy\"}"),
				mc("mixed option types", "{\"options\":[null,7,\"A\",false,{},[],{\"id\":2,\"is_correct\":true}]}",
						"{\"options\":[null,7,\"A\",false,{},[],{\"id\":2,\"isCorrect\":true}]}"),
				mc("string verdict stays string", "{\"options\":[{\"is_correct\":\"true\"}]}",
						"{\"options\":[{\"isCorrect\":\"true\"}]}"),
				mc("canonical string verdict stays string", "{\"options\":[{\"isCorrect\":\"true\"}]}",
						"{\"options\":[{\"isCorrect\":\"true\"}]}"),
				mc("unrelated keys stay unchanged",
						"{\"is_correct\":false,\"correct_answer\":\"root\",\"options\":[{\"id\":1,\"is_correct\":true,\"correct_answer\":\"option\",\"metadata\":{\"is_correct\":false}}]}",
						"{\"is_correct\":false,\"correct_answer\":\"root\",\"options\":[{\"id\":1,\"isCorrect\":true,\"correct_answer\":\"option\",\"metadata\":{\"is_correct\":false}}]}"));
	}

	static Stream<Arguments> conflictingKeys() {
		return Stream.concat(
				Stream.of(
						new String[]{"true", "false"},
						new String[]{"null", "true"},
						new String[]{"true", "null"},
						new String[]{"\"\"", "false"},
						new String[]{"\"true\"", "\"false\""})
						.flatMap(values -> conflicts(QuestionType.MULTIPLE_CHOICE, "is_correct", "isCorrect", values)),
				Stream.of(
						new String[]{"\"legacy\"", "\"camel\""},
						new String[]{"null", "\"camel\""},
						new String[]{"\"legacy\"", "null"},
						new String[]{"\"\"", "\"camel\""},
						new String[]{"true", "false"})
						.flatMap(values -> conflicts(QuestionType.SHORT_ANSWER, "correct_answer", "correctAnswer", values)));
	}

	private static Stream<Arguments> conflicts(QuestionType type, String legacyKey, String apiKey, String[] values) {
		String legacyFirst = "{\"" + legacyKey + "\":" + values[0] + ",\"" + apiKey + "\":" + values[1] + "}";
		String camelFirst = "{\"" + apiKey + "\":" + values[1] + ",\"" + legacyKey + "\":" + values[0] + "}";
		String camelLastExpected = "{\"" + apiKey + "\":" + values[1] + "}";
		String legacyLastExpected = "{\"" + apiKey + "\":" + values[0] + "}";
		if (type == QuestionType.MULTIPLE_CHOICE) {
			legacyFirst = withOptions(legacyFirst);
			camelFirst = withOptions(camelFirst);
			camelLastExpected = withOptions(camelLastExpected);
			legacyLastExpected = withOptions(legacyLastExpected);
		}
		return Stream.of(Arguments.of(type, legacyFirst, camelLastExpected),
				Arguments.of(type, camelFirst, legacyLastExpected));
	}

	private static String withOptions(String option) {
		return "{\"options\":[" + option + "]}";
	}

	private static Arguments mc(String description, String input, String expected) {
		return Arguments.of(description, QuestionType.MULTIPLE_CHOICE, input, expected);
	}

	private static Arguments sa(String description, String input, String expected) {
		return Arguments.of(description, QuestionType.SHORT_ANSWER, input, expected);
	}
}
