package com.english_hub.core.modules.grading.infrastructure.service;

import com.english_hub.core.modules.grading.application.service.AutoGradingService;
import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import com.english_hub.core.modules.grading.domain.model.AutoGradeResult;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.repository.GradedAnswerRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.grading.domain.repository.SubmissionModuleStatusRepository;
import com.english_hub.core.modules.grading.domain.service.AutoGrader;
import com.english_hub.core.modules.module.domain.service.AutoGradeEligibility;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.repository.QuestionRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scores a submitted module by comparing its answers with the expected answers.
 *
 * <p>Called by {@code AutoGradingAsyncWorker} on the auto-grading executor, so the student's submit
 * request never waits for scoring and this transaction is the only one involved in writing the
 * verdicts.
 */
@Service
public class AutoGradingServiceImpl implements AutoGradingService {

	private static final Logger LOGGER = LoggerFactory.getLogger(AutoGradingServiceImpl.class);

	private final GradingRepository gradingRepository;
	private final GradingContextRepository gradingContextRepository;
	private final QuestionRepository questionRepository;
	private final GradedAnswerRepository gradedAnswerRepository;
	private final SubmissionModuleStatusRepository submissionModuleStatusRepository;

	public AutoGradingServiceImpl(
			GradingRepository gradingRepository,
			GradingContextRepository gradingContextRepository,
			QuestionRepository questionRepository,
			GradedAnswerRepository gradedAnswerRepository,
			SubmissionModuleStatusRepository submissionModuleStatusRepository) {
		this.gradingRepository = gradingRepository;
		this.gradingContextRepository = gradingContextRepository;
		this.questionRepository = questionRepository;
		this.gradedAnswerRepository = gradedAnswerRepository;
		this.submissionModuleStatusRepository = submissionModuleStatusRepository;
	}

	@Override
	@Transactional
	public void grade(long submissionModuleId) {
		GradingContext context = gradingContextRepository
				.findBySubmissionModuleId(submissionModuleId)
				.orElse(null);
		if (context == null) {
			LOGGER.warn("Skipped auto grading of submission module {}: no grading context.", submissionModuleId);
			return;
		}
		if (!context.submitted()
				|| !AutoGradeEligibility.isEligible(context.moduleSkill(), context.moduleTaskType())) {
			LOGGER.info(
					"Skipped auto grading of submission module {}: skill {} with task type {} is teacher graded.",
					submissionModuleId,
					context.moduleSkill(),
					context.moduleTaskType());
			return;
		}

		/*
		 * Lock before reading the status: a duplicate event blocks here, then reads the terminal
		 * status the first task wrote and returns without scoring twice.
		 */
		Grading grading = gradingRepository
				.findBySubmissionModuleIdForUpdate(submissionModuleId)
				.orElseThrow(() -> new IllegalStateException(
						"No grading row for submission module " + submissionModuleId));
		if (grading.status() != GradingStatus.PENDING) {
			LOGGER.info(
					"Skipped auto grading of submission module {}: grading is already {}.",
					submissionModuleId,
					grading.status());
			return;
		}

		List<Question> questions = questionRepository.findByModuleIdOrderByOrderIndexAsc(context.moduleId());
		Map<Long, AnswerSubmission> answersByQuestionId = gradedAnswerRepository
				.findBySubmissionModuleId(submissionModuleId).stream()
				.collect(Collectors.toMap(
						AnswerSubmission::questionId, Function.identity(), (first, duplicate) -> first));

		BigDecimal maxScore = context.moduleMaxScore();
		AutoGradeResult result = AutoGrader.grade(questions, answersByQuestionId, maxScore);

		gradedAnswerRepository.saveOutcomes(result.outcomes());
		gradingRepository.saveAutoGrade(
				grading.withAutoGrade(result.totalScore(), maxScore, OffsetDateTime.now(ZoneOffset.UTC)));
		submissionModuleStatusRepository.markGraded(submissionModuleId);
		LOGGER.info(
				"Auto graded submission module {} with score {} out of max score {}.",
				submissionModuleId,
				result.totalScore(),
				maxScore);
	}
}