package com.english_hub.core.modules.question.presentation.rest.dto;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.json.JsonMapper;

class QuestionResponseTest {

	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@Test
	void projectsCsvOptionsInSourceOrderForBothRolesWithoutChangingSource() {
		List<Map<String, Object>> original = options();
		List<Map<String, Object>> reordered = List.of(original.get(2), original.get(0), original.get(3), original.get(1));
		reordered.getFirst().put("isCorrect", false);
		reordered.getFirst().put("answerKey", 2);
		Map<String, Object> answer = new LinkedHashMap<>();
		answer.put("options", reordered);
		String before = objectMapper.writeValueAsString(answer);
		Question source = question(QuestionType.MULTIPLE_CHOICE, answer);

		QuestionResponse teacher = QuestionResponse.from(source, true);
		QuestionResponse student = QuestionResponse.from(source, false);

		assertThat(teacher.correctAnswer()).isSameAs(answer);
		assertThat(student.correctAnswer()).isNull();
		assertThat(student.options()).isEqualTo(teacher.options());
		assertThat(teacher.options()).hasSize(4);
		for (int i = 0; i < reordered.size(); i++) {
			assertThat(teacher.options().get(i).id()).isEqualTo(reordered.get(i).get("id"));
			assertThat(teacher.options().get(i).content()).isEqualTo(reordered.get(i).get("content"));
		}
		assertThat(objectMapper.writeValueAsString(answer)).isEqualTo(before);
		for (QuestionResponse response : List.of(teacher, student)) {
			var json = objectMapper.valueToTree(response);
			for (var option : json.get("options")) {
				assertThat(option.size()).isEqualTo(2);
				assertThat(option.has("id")).isTrue();
				assertThat(option.has("content")).isTrue();
				assertThat(option.has("isCorrect")).isFalse();
				assertThat(option.has("is_correct")).isFalse();
				assertThat(option.has("answerKey")).isFalse();
			}
		}
		assertThat(objectMapper.valueToTree(student).has("correctAnswer")).isFalse();
	}

	@Test
	void preservesNumericIdsAndContentWithoutCoercionOrTrimming() {
		List<Map<String, Object>> options = options();
		options.getFirst().put("id", new BigDecimal("1.50"));
		options.getFirst().put("content", " At the post office ");
		QuestionResponse response = QuestionResponse.from(question(
				QuestionType.MULTIPLE_CHOICE, Map.of("options", options)), false);

		assertThat(response.options().getFirst().id()).isEqualTo(new BigDecimal("1.50"));
		assertThat(response.options().getFirst().content()).isEqualTo(" At the post office ");
	}

	@Test
	void omitsOptionsForShortAnswerForBothRoles() {
		Map<String, Object> answer = Map.of("correctAnswer", "passport");
		Question source = question(QuestionType.SHORT_ANSWER, answer);
		for (boolean includeCorrectAnswer : List.of(true, false)) {
			QuestionResponse response = QuestionResponse.from(source, includeCorrectAnswer);
			assertThat(response.options()).isNull();
			assertThat(objectMapper.valueToTree(response).has("options")).isFalse();
			assertThat(response.correctAnswer()).isEqualTo(includeCorrectAnswer ? answer : null);
		}
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("malformedOptions")
	void omitsAllMalformedOptionsAndLogsOnlyQuestionIdAndReason(String name, Object rawOptions, String reason) {
		Map<String, Object> answer = new LinkedHashMap<>();
		answer.put("options", rawOptions);
		Question source = question(QuestionType.MULTIPLE_CHOICE, answer);
		Logger logger = (Logger) LoggerFactory.getLogger(QuestionResponse.class);
		ListAppender<ILoggingEvent> appender = new ListAppender<>();
		appender.start();
		logger.addAppender(appender);
		try {
			for (boolean includeCorrectAnswer : List.of(true, false)) {
				QuestionResponse response = QuestionResponse.from(source, includeCorrectAnswer);
				assertThat(response.options()).isNull();
				assertThat(objectMapper.valueToTree(response).has("options")).isFalse();
				assertThat(response.correctAnswer()).isEqualTo(includeCorrectAnswer ? answer : null);
			}
			assertThat(appender.list).hasSize(2);
			for (ILoggingEvent event : appender.list) {
				assertThat(event.getLevel()).isEqualTo(Level.WARN);
				assertThat(event.getFormattedMessage()).isEqualTo("questionId=81 optionsError=" + reason);
				assertThat(event.getThrowableProxy()).isNull();
			}
		} finally {
			logger.detachAppender(appender);
			appender.stop();
		}
	}

	@Test
	void omitsOptionsWhenCorrectAnswerOrOptionsAreMissing() {
		for (Question source : List.of(
				question(QuestionType.MULTIPLE_CHOICE, null),
				question(QuestionType.MULTIPLE_CHOICE, Map.of()))) {
			QuestionResponse response = QuestionResponse.from(source, true);
			assertThat(response.options()).isNull();
			assertThat(response.correctAnswer()).isSameAs(source.correctAnswer());
		}
	}

	static Stream<Arguments> malformedOptions() {
		List<Object> nonMap = new ArrayList<>(options());
		nonMap.set(2, "not a map");
		List<Object> nullItem = new ArrayList<>(options());
		nullItem.set(2, null);
		List<Map<String, Object>> five = options();
		five.add(new LinkedHashMap<>(five.getFirst()));
		return Stream.of(
				Arguments.of("null options", null, "options_not_list"),
				Arguments.of("object options", Map.of(), "options_not_list"),
				Arguments.of("string options", "options", "options_not_list"),
				Arguments.of("empty options", List.of(), "option_count_not_four"),
				Arguments.of("three options", options().subList(0, 3), "option_count_not_four"),
				Arguments.of("five options", five, "option_count_not_four"),
				Arguments.of("non-map item", nonMap, "option_not_map"),
				Arguments.of("null item", nullItem, "option_not_map"),
				Arguments.of("missing id", withoutField("id"), "id_missing_or_not_number"),
				Arguments.of("null id", withField("id", null), "id_missing_or_not_number"),
				Arguments.of("string id", withField("id", "3"), "id_missing_or_not_number"),
				Arguments.of("missing content", withoutField("content"), "content_missing_or_blank_or_not_string"),
				Arguments.of("null content", withField("content", null), "content_missing_or_blank_or_not_string"),
				Arguments.of("non-string content", withField("content", 3), "content_missing_or_blank_or_not_string"),
				Arguments.of("empty content", withField("content", ""), "content_missing_or_blank_or_not_string"),
				Arguments.of("blank content", withField("content", " \t\n"), "content_missing_or_blank_or_not_string"),
				Arguments.of("duplicate id", withField("id", 1), "duplicate_id"),
				Arguments.of("same numeric id with different type", withField("id", 1L), "duplicate_id"),
				Arguments.of("same numeric id with different scale", withField("id", new BigDecimal("1.0")), "duplicate_id"),
				Arguments.of("non-JSON numeric id", withField("id", Double.NaN), "id_not_json_number"));
	}

	private static List<Map<String, Object>> withField(String field, Object value) {
		List<Map<String, Object>> options = options();
		options.get(2).put(field, value);
		return options;
	}

	private static List<Map<String, Object>> withoutField(String field) {
		List<Map<String, Object>> options = options();
		options.get(2).remove(field);
		return options;
	}

	private static List<Map<String, Object>> options() {
		return new ArrayList<>(List.of(
				new LinkedHashMap<>(Map.of("id", 1, "content", "At the post office", "is_correct", false)),
				new LinkedHashMap<>(Map.of("id", 2, "content", "In a fitting room", "is_correct", true)),
				new LinkedHashMap<>(Map.of("id", 3, "content", "In a parking meter", "is_correct", false)),
				new LinkedHashMap<>(Map.of("id", 4, "content", "At a bus station", "is_correct", false))));
	}

	private static Question question(QuestionType type, Map<String, Object> answer) {
		return new Question(81L, 21L, "Where can you try on clothes in a shop?", type, answer, BigDecimal.ONE, 1);
	}
}
