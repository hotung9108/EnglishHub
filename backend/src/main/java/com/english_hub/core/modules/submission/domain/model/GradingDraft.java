package com.english_hub.core.modules.submission.domain.model;

/**
 * Draft grading row for {@code bulkCreate}: the submission-module id plus the
 * grading method already resolved from the module's task type.
 */
public record GradingDraft(Long submissionModuleId, GradingMethod method) {
}