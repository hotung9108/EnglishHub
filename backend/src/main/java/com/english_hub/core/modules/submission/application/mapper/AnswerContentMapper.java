package com.english_hub.core.modules.submission.application.mapper;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

/** Maps root keys of question-bound answers without changing stored JSON. */
public final class AnswerContentMapper {

	private static final String LEGACY_IS_CORRECT = "is_correct";
	private static final String IS_CORRECT = "isCorrect";
	private static final String LEGACY_SELECTED_OPTION_IDS = "selected_option_ids";
	private static final String SELECTED_OPTION_IDS = "selectedOptionIds";
	private static final String LEGACY_ANSWER_TEXT = "answer_text";
	private static final String TEXT = "text";

	private AnswerContentMapper() {
	}

	public static JsonNode toResponse(JsonNode content) {
		if (content == null) {
			return null;
		}
		JsonNode result = content.deepCopy();
		if (result instanceof ObjectNode object) {
			renameKey(object, LEGACY_IS_CORRECT, IS_CORRECT);
			renameKey(object, LEGACY_SELECTED_OPTION_IDS, SELECTED_OPTION_IDS);
			renameKey(object, LEGACY_ANSWER_TEXT, TEXT);
		}
		return result;
	}

	private static void renameKey(ObjectNode content, String legacyKey, String apiKey) {
		JsonNode legacyValue = content.remove(legacyKey);
		if (legacyValue == null) {
			return;
		}
		JsonNode apiValue = content.get(apiKey);
		if (apiValue == null || apiValue.isNull()) {
			content.set(apiKey, legacyValue);
		}
	}
}
