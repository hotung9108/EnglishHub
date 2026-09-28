package com.english_hub.core.modules.submission.domain.model;

/** Grading lifecycle of a submission-module. */
public enum GradingStatus {
	PENDING,
	AI_GRADED,
	COMPLETED,
	FAILED
}