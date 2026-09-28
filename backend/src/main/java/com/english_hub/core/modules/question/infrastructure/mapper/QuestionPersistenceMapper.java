package com.english_hub.core.modules.question.infrastructure.mapper;

import com.english_hub.core.common.ApiException;
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

	private static final String INVALID_CORRECT_ANSWER_MESSAGE =
			"Cấu trúc correctAnswer trong dữ liệu lưu trữ không hợp lệ.";

	private final ObjectMapper objectMapper;

	public QuestionPersistenceMapper(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public Question toDomain(com.english_hub.core.infrastructure.persistence.entity.Question source) {
		QuestionType questionType = QuestionType.valueOf(source.getQuestionType().name());
		return new Question(
				source.getId(),
				source.getModuleId(),
				source.getContent(),
				questionType,
				toApiCorrectAnswer(source.getCorrectAnswer(), questionType),
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

	private Map<String, Object> toApiCorrectAnswer(String json, QuestionType questionType) {
		return normalizeRoot(json, true, questionType == QuestionType.SHORT_ANSWER);
	}

	private String toPersistenceCorrectAnswer(Map<String, Object> correctAnswer) {
		try {
			return objectMapper.writeValueAsString(normalizeValue(correctAnswer, false));
		} catch (JacksonException exception) {
			throw new IllegalArgumentException("correct_answer must contain valid JSON", exception);
		}
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> normalizeRoot(String json, boolean toApi, boolean allowLegacyScalarString) {
		if (json == null || json.isBlank()) {
			throw invalidCorrectAnswer();
		}
		try {
			Object parsed = objectMapper.readValue(json, Object.class);
			Object normalized;
			if (parsed instanceof Map<?, ?>) {
				normalized = normalizeValue(parsed, toApi);
			} else if (allowLegacyScalarString && parsed instanceof String text) {
				Map<String, Object> wrapped = new LinkedHashMap<>();
				wrapped.put("correct_answer", text);
				normalized = normalizeValue(wrapped, toApi);
			} else {
				throw invalidCorrectAnswer();
			}
			if (!(normalized instanceof Map<?, ?> map)) {
				throw invalidCorrectAnswer();
			}
			return (Map<String, Object>) map;
		} catch (JacksonException exception) {
			throw invalidCorrectAnswer();
		}
	}

	private ApiException invalidCorrectAnswer() {
		return ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
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
