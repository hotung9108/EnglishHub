package com.english_hub.core.modules.submission.domain.event;

/**
 * Raised once a submission module's answers are persisted and its status has flipped to submitted.
 *
 * <p>Carries only the id on purpose: whether the module is auto-graded is decided by
 * {@code AutoGradeEligibility} inside the grading context, so the rule has exactly one home
 * instead of being precomputed here and duplicated on the consumer side.
 */
public record SubmissionModuleSubmittedEvent(Long submissionModuleId) {
}