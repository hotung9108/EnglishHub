package com.english_hub.core.modules.submission.presentation.rest.dto.answercontent;

import com.english_hub.core.modules.submission.domain.model.QuestionType;
import java.util.Map;

/**
 * Typed contract for the two supported submitted-answer {@code content} payload shapes.
 *
 * <p>Subtypes are selected from the payload shape by {@link AnswerContentDeserializer}, so the wire
 * format stays exactly as documented: {@code {"selectedOptionIds": [...]}} for
 * {@code MULTIPLE_CHOICE} and {@code {"text": "..."}} for {@code SHORT_ANSWER}.
 *
 * <p>{@link #questionType()} carries the shape that the payload claims to be, so the service can
 * reject an answer whose shape does not match the type of the question it was sent for. Shape
 * detection alone cannot do that, because both shapes are legal JSON objects.
 *
 * <p>The {@code @JsonDeserialize} registration lives on the request properties rather than here:
 * Jackson resolves class annotations through implemented interfaces, so annotating this interface
 * would make every concrete subtype deserialize through {@link AnswerContentDeserializer} again
 * and recurse forever. Properties of this type must therefore declare
 * {@code @JsonDeserialize(using = AnswerContentDeserializer.class)}.
 */
public sealed interface AnswerContent permits MultipleChoiceAnswerContent, ShortAnswerAnswerContent {

	/** The question type this content shape is valid for. */
	QuestionType questionType();

	/**
	 * Renders this content as the camelCase map that the JSONB {@code answers.content} column and
	 * {@code AnswerResult} carry.
	 */
	Map<String, Object> toMap();
}
