package com.english_hub.core.modules.question.presentation.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public record QuestionResponse(
		Long id,
		String content,
		String questionType,
		BigDecimal score,
		int orderIndex,
		@JsonInclude(JsonInclude.Include.NON_NULL) List<QuestionOptionResponse> options,
		@JsonInclude(JsonInclude.Include.NON_NULL) Map<String, Object> correctAnswer) {

	private static final Logger LOGGER = LoggerFactory.getLogger(QuestionResponse.class);
	private static final int OPTION_COUNT = 4;

	public static QuestionResponse from(Question question, boolean includeCorrectAnswer) {
		List<QuestionOptionResponse> options = publicOptions(question);
		return new QuestionResponse(
				question.id(),
				question.content(),
				question.questionType().name(),
				question.score(),
				question.orderIndex(),
				options,
				includeCorrectAnswer ? question.correctAnswer() : null);
	}

	private static List<QuestionOptionResponse> publicOptions(Question question) {
		if (question.questionType() != QuestionType.MULTIPLE_CHOICE) {
			return null;
		}
		Object rawOptions = question.correctAnswer() == null ? null : question.correctAnswer().get("options");
		String error = optionsError(rawOptions);
		if (error != null) {
			LOGGER.warn("questionId={} optionsError={}", question.id(), error);
			return null;
		}

		List<QuestionOptionResponse> options = new ArrayList<>();
		for (Object item : (List<?>) rawOptions) {
			Map<?, ?> fields = (Map<?, ?>) item;
			options.add(new QuestionOptionResponse((Number) fields.get("id"), (String) fields.get("content")));
		}
		return List.copyOf(options);
	}

	private static String optionsError(Object rawOptions) {
		if (!(rawOptions instanceof List<?> options)) {
			return "options_not_list";
		}
		if (options.size() != OPTION_COUNT) {
			return "option_count_not_four";
		}
		Set<BigDecimal> ids = new HashSet<>();
		for (Object item : options) {
			if (!(item instanceof Map<?, ?> fields)) {
				return "option_not_map";
			}
			String error = optionError(fields, ids);
			if (error != null) {
				return error;
			}
		}
		return null;
	}

	private static String optionError(Map<?, ?> fields, Set<BigDecimal> ids) {
		if (!(fields.get("id") instanceof Number id)) {
			return "id_missing_or_not_number";
		}
		if (!(fields.get("content") instanceof String content) || content.isBlank()) {
			return "content_missing_or_blank_or_not_string";
		}
		try {
			if (!ids.add(new BigDecimal(id.toString()).stripTrailingZeros())) {
				return "duplicate_id";
			}
		} catch (NumberFormatException exception) {
			return "id_not_json_number";
		}
		return null;
	}
}
