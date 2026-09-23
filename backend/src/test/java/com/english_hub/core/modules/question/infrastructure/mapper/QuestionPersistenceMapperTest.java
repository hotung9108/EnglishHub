package com.english_hub.core.modules.question.infrastructure.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;
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
}
