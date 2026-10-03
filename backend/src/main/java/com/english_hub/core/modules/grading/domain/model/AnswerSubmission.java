package com.english_hub.core.modules.grading.domain.model;

import java.util.Map;

/** One submitted answer reduced to the shape the comparator needs. */
public record AnswerSubmission(Long answerId, Long questionId, Map<String, Object> content) {
}