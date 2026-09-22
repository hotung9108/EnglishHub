package com.english_hub.core.modules.question.infrastructure.mapper;

import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/** Maps API-facing camelCase question JSON to the legacy snake_case JSONB shape. */
@Component
public class QuestionPersistenceMapper {

	private final ObjectMapper objectMapper;

	public QuestionPersistenceMapper(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public Question toDomain(com.english_hub.core.infrastructure.persistence.entity.Question source) {
		return new Question(
				source.getId(),
				source.getModuleId(),
				source.getContent(),
				QuestionType.valueOf(source.getQuestionType().name()),
				toApiCorrectAnswer(source.getCorrectAnswer()),
				source.getScore(),
				source.getOrderIndex());
	}

	public com.english_hub.core.infrastructure.persistence.entity.Question toNewEntity(Question source) {
		return new com.english_hub.core.infrastructure.persistence.entity.Question(
				source.moduleId(),
				source.content(),
				com.english_hub.core.infrastructure.persistence.entity.QuestionType.valueOf(
						source.questionType().name()),
				toPersistenceCorrectAnswer(source.correctAnswer()),
				source.score(),
				source.orderIndex());
	}

	public void updateEntity(
			com.english_hub.core.infrastructure.persistence.entity.Question target,
			Question source) {
		target.updateFrom(
				source.content(),
				toPersistenceCorrectAnswer(source.correctAnswer()),
				source.score(),
				source.orderIndex());
	}

	private Map<String, Object> toApiCorrectAnswer(String json) {
		return normalizeRoot(json, true);
	}

	private String toPersistenceCorrectAnswer(Map<String, Object> correctAnswer) {
		try {
			return objectMapper.writeValueAsString(normalizeValue(correctAnswer, false));
		} catch (JacksonException exception) {
			throw new IllegalArgumentException("correct_answer must contain valid JSON", exception);
		}
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> normalizeRoot(String json, boolean toApi) {
		try {
			Object parsed = objectMapper.readValue(json, Map.class);
			Object normalized = normalizeValue(parsed, toApi);
			if (!(normalized instanceof Map<?, ?> map)) {
				throw new IllegalArgumentException("correct_answer must be a JSON object");
			}
			return (Map<String, Object>) map;
		} catch (JacksonException exception) {
			throw new IllegalArgumentException("correct_answer must contain valid JSON", exception);
		}
	}

	private Object normalizeValue(Object value, boolean toApi) {
		if (value instanceof Map<?, ?> map) {
			Map<String, Object> normalized = new LinkedHashMap<>();
			for (Map.Entry<?, ?> entry : map.entrySet()) {
				String key = String.valueOf(entry.getKey());
				normalized.put(normalizeKey(key, toApi), normalizeValue(entry.getValue(), toApi));
			}
			return normalized;
		}
		if (value instanceof List<?> list) {
			return list.stream().map(item -> normalizeValue(item, toApi)).toList();
		}
		return value;
	}

	private String normalizeKey(String key, boolean toApi) {
		if (toApi) {
			return switch (key) {
				case "is_correct" -> "isCorrect";
				case "correct_answer" -> "correctAnswer";
				default -> key;
			};
		}
		return switch (key) {
			case "isCorrect" -> "is_correct";
			case "correctAnswer" -> "correct_answer";
			default -> key;
		};
	}
}
