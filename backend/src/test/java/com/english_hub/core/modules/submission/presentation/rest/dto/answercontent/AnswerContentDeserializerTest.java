package com.english_hub.core.modules.submission.presentation.rest.dto.answercontent;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.english_hub.core.modules.submission.domain.model.QuestionType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.exc.MismatchedInputException;
import tools.jackson.databind.json.JsonMapper;

class AnswerContentDeserializerTest {

	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@Test
	void selectedOptionIdsPayloadBecomesMultipleChoiceContent() {
		AnswerContent content = readContent("{\"selectedOptionIds\":[1]}");

		assertThat(content).isEqualTo(new MultipleChoiceAnswerContent(List.of(1L)));
		assertThat(content.questionType()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
	}

	@Test
	void textPayloadBecomesShortAnswerContent() {
		AnswerContent content = readContent("{\"text\":\"The answer is...\"}");

		assertThat(content).isEqualTo(new ShortAnswerAnswerContent("The answer is..."));
		assertThat(content.questionType()).isEqualTo(QuestionType.SHORT_ANSWER);
	}

	@Test
	void multipleChoiceTakesPrecedenceWhenBothKeysPresent() {
		assertThat(readContent("{\"text\":\"English\",\"selectedOptionIds\":[1]}"))
				.isInstanceOf(MultipleChoiceAnswerContent.class);
	}

	@Test
	void rejectsPayloadWithoutARecognisedKey() {
		assertRejected("{}");
		assertRejected("{\"answer\":\"English\"}");
		assertRejected("{\"selected_option_ids\":[1]}");
	}

	@Test
	void rejectsNonObjectPayload() {
		assertRejected("\"English\"");
		assertRejected("[1,2,3]");
	}

	/**
	 * JSON {@code null} is handled by Jackson before the deserializer runs; {@code @NotNull} on
	 * the request property is what rejects it.
	 */
	@Test
	void nullPayloadBecomesNullWithoutReachingTheDeserializer() {
		Wrapper wrapper = objectMapper.readValue("{\"content\":null}", Wrapper.class);

		assertThat(wrapper.content()).isNull();
	}

	@Test
	void rejectsMalformedNestedValue() {
		assertRejected("{\"selectedOptionIds\":\"one\"}");
		assertRejected("{\"selectedOptionIds\":[\"x\"]}");
	}

	/**
	 * Jackson coerces a scalar into {@code String} by default, so a numeric {@code text} is
	 * accepted here. Field-level emptiness rules are covered by
	 * {@code AnswerContentValidationTest}.
	 */
	@Test
	void coercesNonStringText() {
		assertThat(readContent("{\"text\":123}")).isEqualTo(new ShortAnswerAnswerContent("123"));
	}

	/**
	 * Bean validation, not the deserializer, is what rejects an empty selection, a non-positive
	 * option id or blank text; the shape is still recognised so the client gets the field-level
	 * message rather than a generic shape error. See {@code AnswerContentValidationTest}.
	 */
	@Test
	void acceptsShapesThatOnlyBeanValidationRejects() {
		assertThat(readContent("{\"selectedOptionIds\":[]}"))
				.isEqualTo(new MultipleChoiceAnswerContent(List.of()));
		assertThat(readContent("{\"selectedOptionIds\":null}"))
				.isEqualTo(new MultipleChoiceAnswerContent(null));
		assertThat(readContent("{\"selectedOptionIds\":[0]}"))
				.isEqualTo(new MultipleChoiceAnswerContent(List.of(0L)));
		assertThat(readContent("{\"text\":\"   \"}")).isEqualTo(new ShortAnswerAnswerContent("   "));
	}

	@Test
	void rendersCamelCaseMapsForTheJsonbColumn() {
		assertThat(new MultipleChoiceAnswerContent(List.of(1L, 3L)).toMap())
				.containsExactlyEntriesOf(Map.of("selectedOptionIds", List.of(1L, 3L)));
		assertThat(new ShortAnswerAnswerContent("The answer is...").toMap())
				.containsExactlyEntriesOf(Map.of("text", "The answer is..."));
	}

	private AnswerContent readContent(String json) {
		return objectMapper.readValue("{\"content\":" + json + "}", Wrapper.class).content();
	}

	private void assertRejected(String json) {
		assertThatThrownBy(() -> readContent(json)).isInstanceOf(MismatchedInputException.class);
	}

	private record Wrapper(
			@JsonDeserialize(using = AnswerContentDeserializer.class) AnswerContent content) {
	}
}
