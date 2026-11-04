package com.english_hub.core.modules.submission.application.mapper;

import com.english_hub.core.modules.submission.domain.model.QuestionType;
import java.util.Map;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.JsonNodeFactory;
import tools.jackson.databind.node.ObjectNode;

/** Maps stored correct answers to the submission module response without changing stored JSON. */
public final class QuestionCorrectAnswerMapper {

	private static final String OPTIONS = "options";
	private static final String LEGACY_IS_CORRECT = "is_correct";
	private static final String IS_CORRECT = "isCorrect";
	private static final String LEGACY_CORRECT_ANSWER = "correct_answer";
	private static final String CORRECT_ANSWER = "correctAnswer";

	private QuestionCorrectAnswerMapper() {
	}

	public static JsonNode toResponse(QuestionType questionType, JsonNode correctAnswer) {
		if (correctAnswer == null) {
			return null;
		}
		JsonNode result = correctAnswer.deepCopy();
		if (questionType == QuestionType.SHORT_ANSWER) {
			if (result instanceof ObjectNode object) {
				return renameKey(object, LEGACY_CORRECT_ANSWER, CORRECT_ANSWER);
			}
			if (result.isString()) {
				ObjectNode wrapped = JsonNodeFactory.instance.objectNode();
				wrapped.set(CORRECT_ANSWER, result);
				return wrapped;
			}
		}
		if (questionType == QuestionType.MULTIPLE_CHOICE && result instanceof ObjectNode object) {
			mapOptions(object.get(OPTIONS));
		}
		return result;
	}

	private static void mapOptions(JsonNode optionsNode) {
		if (!(optionsNode instanceof ArrayNode options)) {
			return;
		}
		for (int index = 0; index < options.size(); index++) {
			if (options.get(index) instanceof ObjectNode option) {
				options.set(index, renameKey(option, LEGACY_IS_CORRECT, IS_CORRECT));
			}
		}
	}

	private static ObjectNode renameKey(ObjectNode source, String legacyKey, String apiKey) {
		ObjectNode result = JsonNodeFactory.instance.objectNode();
		for (Map.Entry<String, JsonNode> entry : source.properties()) {
			String key = entry.getKey().equals(legacyKey) ? apiKey : entry.getKey();
			result.set(key, entry.getValue());
		}
		return result;
	}
}
