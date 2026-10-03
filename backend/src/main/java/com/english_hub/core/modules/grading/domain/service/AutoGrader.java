package com.english_hub.core.modules.grading.domain.service;

import com.english_hub.core.modules.grading.domain.model.AnswerOutcome;
import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import com.english_hub.core.modules.grading.domain.model.AutoGradeResult;
import com.english_hub.core.modules.question.domain.model.Question;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Scores a submission module by comparing every module question against the answer the student
 * submitted for it.
 *
 * <p>Questions the student left unanswered score zero: {@code SubmissionService} never rejects a
 * partial submission, so a missing answer is a valid state rather than an error.
 *
 * <p>The awarded total is capped at the module max score because nothing in the schema keeps
 * {@code SUM(questions.score)} within {@code modules.max_score}, and {@code max_score_snapshot}
 * is written from that module max score.
 */
public final class AutoGrader {

	private AutoGrader() {
	}

	public static AutoGradeResult grade(
			List<Question> questions,
			Map<Long, AnswerSubmission> answersByQuestionId,
			BigDecimal maxScore) {
		List<AnswerOutcome> outcomes = new ArrayList<>();
		BigDecimal total = BigDecimal.ZERO;
		for (Question question : questions) {
			AnswerSubmission submission = answersByQuestionId == null ? null : answersByQuestionId.get(question.id());
			boolean correct = submission != null
					&& AnswerComparator.matches(
							question.questionType(), submission.content(), question.correctAnswer());
			BigDecimal awarded = correct ? nullToZero(question.score()) : BigDecimal.ZERO;
			total = total.add(awarded);
			outcomes.add(new AnswerOutcome(
					submission == null ? null : submission.answerId(), question.id(), correct, awarded));
		}
		return new AutoGradeResult(outcomes, capAtMaxScore(total, maxScore));
	}

	private static BigDecimal capAtMaxScore(BigDecimal total, BigDecimal maxScore) {
		if (maxScore == null || total.compareTo(maxScore) <= 0) {
			return total;
		}
		return maxScore;
	}

	private static BigDecimal nullToZero(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}
}