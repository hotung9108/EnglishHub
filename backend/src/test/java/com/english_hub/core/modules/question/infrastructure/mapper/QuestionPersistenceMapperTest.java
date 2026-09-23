package com.english_hub.core.modules.question.infrastructure.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.json.JsonMapper;

class QuestionPersistenceMapperTest {

	private final QuestionPersistenceMapper mapper =
			new QuestionPersistenceMapper(JsonMapper.builder().build());

	@Test
	void wrapsLegacyScalarCorrectAnswerWhenReading() {
		com.english_hub.core.infrastructure.persistence.entity.Question entity =
				new com.english_hub.core.infrastructure.persistence.entity.Question(
						9L,
						"Write the answer.",
						com.english_hub.core.infrastructure.persistence.entity.QuestionType.SHORT_ANSWER,
						"\"English\"",
						BigDecimal.ONE,
						1);

		Question result = mapper.toDomain(entity);

		assertThat(result.correctAnswer()).containsExactly(Map.entry("correctAnswer", "English"));
	}

	@Test
	void alwaysWritesCanonicalObjectForNewQuestion() {
		Question source = new Question(
				null,
				9L,
				"Write the answer.",
				QuestionType.SHORT_ANSWER,
				Map.of("correctAnswer", "English"),
				BigDecimal.ONE,
				1);

		com.english_hub.core.infrastructure.persistence.entity.Question entity = mapper.toNewEntity(source);

		assertThat(entity.getCorrectAnswer()).isEqualTo("{\"correct_answer\":\"English\"}");
	}

	@Test
	void rejectsLegacyArrayCorrectAnswer() {
		assertInvalidCorrectAnswer(
				newEntity(QuestionType.SHORT_ANSWER, "[\"English\"]"));
	}

	@Test
	void rejectsLegacyJsonNullCorrectAnswer() {
		assertInvalidCorrectAnswer(
				newEntity(QuestionType.SHORT_ANSWER, "null"));
	}

	@Test
	void rejectsScalarCorrectAnswerForMultipleChoice() {
		assertInvalidCorrectAnswer(
				newEntity(QuestionType.MULTIPLE_CHOICE, "\"A\""));
	}

	private com.english_hub.core.infrastructure.persistence.entity.Question newEntity(
			QuestionType questionType,
			String correctAnswer) {
		return new com.english_hub.core.infrastructure.persistence.entity.Question(
				9L,
				"Question",
				com.english_hub.core.infrastructure.persistence.entity.QuestionType.valueOf(questionType.name()),
				correctAnswer,
				BigDecimal.ONE,
				1);
	}

	private void assertInvalidCorrectAnswer(
			com.english_hub.core.infrastructure.persistence.entity.Question entity) {
		assertThatThrownBy(() -> mapper.toDomain(entity))
				.isInstanceOf(ApiException.class)
				.hasMessage("Cấu trúc correctAnswer trong dữ liệu lưu trữ không hợp lệ.")
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_REQUEST));
	}
}
