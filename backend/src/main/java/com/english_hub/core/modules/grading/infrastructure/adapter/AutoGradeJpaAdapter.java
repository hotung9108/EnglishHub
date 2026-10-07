package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.grading.domain.model.AnswerOutcome;
import com.english_hub.core.modules.grading.domain.model.AnswerSubmission;
import com.english_hub.core.modules.grading.domain.repository.GradedAnswerRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingFailureRepository;
import com.english_hub.core.modules.grading.domain.repository.SubmissionModuleStatusRepository;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/**
 * JPA adapter for the auto-grading write ports. Reads and writes {@code answers.content} in place
 * rather than through the submission cluster's read model, because each verdict has to be merged
 * into the same JSONB document the student submitted.
 */
@Repository
public class AutoGradeJpaAdapter implements
		GradedAnswerRepository,
		SubmissionModuleStatusRepository,
		GradingFailureRepository {

	private static final String INVALID_CONTENT_MESSAGE = "answers.content must contain valid JSON";

	private final AnswerRepository answerRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final GradingRepository gradingRepository;
	private final ObjectMapper objectMapper;

	public AutoGradeJpaAdapter(
			AnswerRepository answerRepository,
			SubmissionModuleRepository submissionModuleRepository,
			GradingRepository gradingRepository,
			ObjectMapper objectMapper) {
		this.answerRepository = answerRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.gradingRepository = gradingRepository;
		this.objectMapper = objectMapper;
	}

	@Override
	@Transactional(readOnly = true)
	public List<AnswerSubmission> findBySubmissionModuleId(Long submissionModuleId) {
		return answerRepository.findBySubmissionModuleId(submissionModuleId).stream()
				.filter(answer -> answer.getQuestionId() != null)
				.map(answer -> new AnswerSubmission(
						answer.getId(), answer.getQuestionId(), toContentMap(answer.getContent())))
				.toList();
	}

	@Override
	@Transactional
	public void saveOutcomes(List<AnswerOutcome> outcomes) {
		Map<Long, AnswerOutcome> outcomesByAnswerId = new LinkedHashMap<>();
		for (AnswerOutcome outcome : outcomes) {
			if (outcome.answerId() != null) {
				outcomesByAnswerId.put(outcome.answerId(), outcome);
			}
		}
		if (outcomesByAnswerId.isEmpty()) {
			return;
		}
		answerRepository.findAllById(outcomesByAnswerId.keySet())
				.forEach(answer -> answer.applyGradingOutcome(
						outcomesByAnswerId.get(answer.getId()).correct(),
						outcomesByAnswerId.get(answer.getId()).score()));
	}

	@Override
	@Transactional
	public void markGraded(Long submissionModuleId) {
		submissionModuleRepository.findById(submissionModuleId).ifPresent(module -> {
			if (module.getStatus() != SubmissionStatus.GRADED) {
				module.markGraded();
			}
		});
	}

	@Override
	@Transactional
	public void markFailed(Long submissionModuleId) {
		gradingRepository.findBySubmissionModuleId(submissionModuleId).ifPresent(grading -> {
			if (grading.getStatus() != GradingStatus.COMPLETED) {
				grading.markFailed();
			}
		});
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> toContentMap(String content) {
		if (content == null || content.isBlank()) {
			return Map.of();
		}
		try {
			return objectMapper.readValue(content, Map.class);
		} catch (JacksonException exception) {
			throw new IllegalArgumentException(INVALID_CONTENT_MESSAGE, exception);
		}
	}
}