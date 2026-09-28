package com.english_hub.core.modules.submission.presentation.rest.dto.answercontent;

import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;

/**
 * Resolves the {@link AnswerContent} subtype from the payload shape, because the wire contract
 * carries no discriminator field. A payload with a {@code selectedOptionIds} array is a
 * {@link MultipleChoiceAnswerContent}; a payload with {@code text} is a
 * {@link ShortAnswerAnswerContent}. Anything else is rejected.
 */
public class AnswerContentDeserializer extends ValueDeserializer<AnswerContent> {

	/**
	 * Rejection message handed to the client for an unusable shape. It starts with a distinctive
	 * phrase so {@code GlobalExceptionHandler} can surface it instead of the generic
	 * "Dữ liệu không hợp lệ.".
	 */
	public static final String INVALID_SHAPE_MESSAGE =
			"Nội dung câu trả lời phải là {\"selectedOptionIds\": [...]} cho MULTIPLE_CHOICE "
			+ "hoặc {\"text\": \"...\"} cho SHORT_ANSWER.";

	@Override
	public AnswerContent deserialize(JsonParser parser, DeserializationContext context) {
		JsonNode node = context.readTree(parser);
		if (node != null && node.isObject()) {
			if (node.has("selectedOptionIds")) {
				return context.readTreeAsValue(node, MultipleChoiceAnswerContent.class);
			}
			if (node.has("text")) {
				return context.readTreeAsValue(node, ShortAnswerAnswerContent.class);
			}
		}
		return context.reportInputMismatch(AnswerContent.class, INVALID_SHAPE_MESSAGE);
	}
}
