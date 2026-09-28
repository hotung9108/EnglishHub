package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.exc.MismatchedInputException;
import tools.jackson.databind.json.JsonMapper;

class CorrectAnswerDeserializerTest {

	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@Test
	void optionsPayloadBecomesMultipleChoiceAnswer() {
		CorrectAnswer answer = readCorrectAnswer("""
				{"options":[
				  {"id":1,"content":"Option A","isCorrect":true},
				  {"id":2,"content":"Option B","isCorrect":false},
				  {"id":3,"content":"Option C","isCorrect":false},
				  {"id":4,"content":"Option D","isCorrect":false}
				]}
				""");

		assertThat(answer).isEqualTo(new MultipleChoiceCorrectAnswer(List.of(
				new MultipleChoiceCorrectAnswer.QuestionOption(1, "Option A", true),
				new MultipleChoiceCorrectAnswer.QuestionOption(2, "Option B", false),
				new MultipleChoiceCorrectAnswer.QuestionOption(3, "Option C", false),
				new MultipleChoiceCorrectAnswer.QuestionOption(4, "Option D", false))));
	}

	@Test
	void correctAnswerPayloadBecomesShortAnswer() {
		assertThat(readCorrectAnswer("{\"correctAnswer\":\"English\"}"))
				.isEqualTo(new ShortAnswerCorrectAnswer("English"));
	}

	@Test
	void acceptsLegacySnakeCaseKeys() {
		assertThat(readCorrectAnswer("{\"correct_answer\":\"English\"}"))
				.isEqualTo(new ShortAnswerCorrectAnswer("English"));

		assertThat(readCorrectAnswer("""
				{"options":[
				  {"id":1,"content":"A","is_correct":true},
				  {"id":2,"content":"B","is_correct":false},
				  {"id":3,"content":"C","is_correct":false},
				  {"id":4,"content":"D","is_correct":false}
				]}
				""")).isEqualTo(new MultipleChoiceCorrectAnswer(List.of(
						new MultipleChoiceCorrectAnswer.QuestionOption(1, "A", true),
						new MultipleChoiceCorrectAnswer.QuestionOption(2, "B", false),
						new MultipleChoiceCorrectAnswer.QuestionOption(3, "C", false),
						new MultipleChoiceCorrectAnswer.QuestionOption(4, "D", false))));
	}

	@Test
	void multipleChoiceTakesPrecedenceWhenBothKeysPresent() {
		assertThat(readCorrectAnswer("""
				{"correctAnswer":"English","options":[
				  {"id":1,"content":"A","isCorrect":true},
				  {"id":2,"content":"B","isCorrect":false},
				  {"id":3,"content":"C","isCorrect":false},
				  {"id":4,"content":"D","isCorrect":false}
				]}
				""")).isInstanceOf(MultipleChoiceCorrectAnswer.class);
	}

	@Test
	void rejectsPayloadWithoutARecognisedKey() {
		assertRejected("{}");
		assertRejected("{\"answer\":\"English\"}");
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
		Wrapper wrapper = objectMapper.readValue("{\"correctAnswer\":null}", Wrapper.class);

		assertThat(wrapper.correctAnswer()).isNull();
	}

	@Test
	void rejectsMalformedNestedOption() {
		assertRejected("{\"options\":[{\"id\":\"one\",\"content\":\"A\",\"isCorrect\":true}]}");
	}

	/**
	 * Guards the {@code isCorrect} component name: without an explicit {@code @JsonProperty} Jackson
	 * would treat the {@code isCorrect()} accessor as a {@code correct} property.
	 */
	@Test
	void multipleChoiceOptionSerializesWithIsCorrectKey() {
		String json = objectMapper.writeValueAsString(new MultipleChoiceCorrectAnswer(List.of(
				new MultipleChoiceCorrectAnswer.QuestionOption(1, "A", true),
				new MultipleChoiceCorrectAnswer.QuestionOption(2, "B", false),
				new MultipleChoiceCorrectAnswer.QuestionOption(3, "C", false),
				new MultipleChoiceCorrectAnswer.QuestionOption(4, "D", false))));

		assertThat(json).contains("\"isCorrect\":true").doesNotContain("\"correct\":");
	}

	@Test
	void rendersCamelCaseMapsForTheDomainCommand() {
		CorrectAnswer multipleChoice = new MultipleChoiceCorrectAnswer(List.of(
				new MultipleChoiceCorrectAnswer.QuestionOption(1, "A", true),
				new MultipleChoiceCorrectAnswer.QuestionOption(2, "B", false),
				new MultipleChoiceCorrectAnswer.QuestionOption(3, "C", false),
				new MultipleChoiceCorrectAnswer.QuestionOption(4, "D", false)));

		assertThat(multipleChoice.toMap()).containsOnlyKeys("options");
		assertThat((List<?>) multipleChoice.toMap().get("options")).hasSize(4);

		@SuppressWarnings("unchecked")
		Map<String, Object> first = (Map<String, Object>) ((List<?>) multipleChoice.toMap().get("options")).get(0);
		assertThat(first)
				.containsOnlyKeys("id", "content", "isCorrect")
				.containsEntry("id", 1)
				.containsEntry("content", "A")
				.containsEntry("isCorrect", true);

		assertThat(new ShortAnswerCorrectAnswer("English").toMap())
				.containsExactlyEntriesOf(Map.of("correctAnswer", "English"));
	}

	private CorrectAnswer readCorrectAnswer(String json) {
		return objectMapper.readValue("{\"correctAnswer\":" + json + "}", Wrapper.class).correctAnswer();
	}

	private void assertRejected(String json) {
		assertThatThrownBy(() -> readCorrectAnswer(json)).isInstanceOf(MismatchedInputException.class);
	}

	private record Wrapper(
			@JsonDeserialize(using = CorrectAnswerDeserializer.class) CorrectAnswer correctAnswer) {
	}
}
