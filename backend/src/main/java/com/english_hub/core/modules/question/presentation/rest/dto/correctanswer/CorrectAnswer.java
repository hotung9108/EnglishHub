package com.english_hub.core.modules.question.presentation.rest.dto.correctanswer;

import com.english_hub.core.modules.question.domain.model.QuestionType;
import java.util.Map;

/**
 * Typed contract for the two supported {@code correctAnswer} payload shapes.
 *
 * <p>Subtypes are selected from the payload shape by {@link CorrectAnswerDeserializer}, so the
 * wire format stays exactly as documented: {@code {"options": [...]}} for {@code MULTIPLE_CHOICE}
 * and {@code {"correctAnswer": "..."}} for {@code SHORT_ANSWER}.
 *
 * <p>{@link #questionType()} carries the question type that this payload shape corresponds to,
 * allowing boundary and domain validation to ensure shape integrity.
 *
 * <p>The {@code @JsonDeserialize} registration lives on the request properties rather than here:
 * Jackson resolves class annotations through implemented interfaces, so annotating this interface
 * would make every concrete subtype deserialize through {@link CorrectAnswerDeserializer} again
 * and recurse forever. Properties of this type must therefore declare
 * {@code @JsonDeserialize(using = CorrectAnswerDeserializer.class)}.
 */
public sealed interface CorrectAnswer permits MultipleChoiceCorrectAnswer, ShortAnswerCorrectAnswer {

	/** The question type this answer shape corresponds to. */
	QuestionType questionType();

	/**
	 * Renders this answer as the camelCase map that the question commands and the domain model
	 * carry. The snake_case translation for the JSONB column is applied later by
	 * {@code QuestionPersistenceMapper}.
	 */
	Map<String, Object> toMap();
}

