package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;

/**
 * Resolves the {@link CorrectAnswer} subtype from the payload shape, because the wire contract
 * carries no discriminator field. A payload with an {@code options} array is a
 * {@link MultipleChoiceCorrectAnswer}; a payload with {@code correctAnswer} (or the legacy
 * {@code correct_answer}) is a {@link ShortAnswerCorrectAnswer}. Anything else is rejected.
 */
public class CorrectAnswerDeserializer extends ValueDeserializer<CorrectAnswer> {

	static final String INVALID_SHAPE_MESSAGE =
			"correctAnswer phải là {\"options\": [...]} cho MULTIPLE_CHOICE "
			+ "hoặc {\"correctAnswer\": \"...\"} cho SHORT_ANSWER.";

	@Override
	public CorrectAnswer deserialize(JsonParser parser, DeserializationContext context) {
		JsonNode node = context.readTree(parser);
		if (node != null && node.isObject()) {
			if (node.has("options")) {
				return context.readTreeAsValue(node, MultipleChoiceCorrectAnswer.class);
			}
			if (node.has("correctAnswer") || node.has("correct_answer")) {
				return context.readTreeAsValue(node, ShortAnswerCorrectAnswer.class);
			}
		}
		return context.reportInputMismatch(CorrectAnswer.class, INVALID_SHAPE_MESSAGE);
	}
}
