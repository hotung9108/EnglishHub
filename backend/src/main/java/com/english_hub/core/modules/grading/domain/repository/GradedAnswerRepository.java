package com.english_hub.core.modules.grading.domain.repository;

import com.english_hub.core.modules.grading.domain.model.AnswerOutcome;
import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import java.util.List;

/** Domain port for reading and writing the per-question verdicts of a submission module. */
public interface GradedAnswerRepository {

	/** Returns the question-bound answers of a submission module, keyed by question id. */
	List<AnswerSubmission> findBySubmissionModuleId(Long submissionModuleId);

	/**
	 * Persists each verdict into the matching {@code answers.content} document. Outcomes without an
	 * answer id are skipped: the student never answered that question, so there is no row to update.
	 */
	void saveOutcomes(List<AnswerOutcome> outcomes);
}