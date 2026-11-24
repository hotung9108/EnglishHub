package com.english_hub.core.modules.grading.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingMethod;
import com.english_hub.core.modules.grading.domain.model.GradingStatus;
import com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GradingAiResultPersistenceServiceTest {

	@Mock
	private GradingRepository gradingRepository;

	@Mock
	private AnswerAnnotationRepository answerAnnotationRepository;

	private GradingAiResultPersistenceService service;

	@BeforeEach
	void setUp() {
		service = new GradingAiResultPersistenceService(gradingRepository, answerAnnotationRepository);
	}

	@Test
	void persistAiResult_whenGradingIsCompleted_discardsGradeAndAnnotations() {
		Grading completed = grading(11L, GradingStatus.COMPLETED, new BigDecimal("8.50"));
		Grading aiResult = grading(11L, GradingStatus.AI_GRADED, new BigDecimal("7.00"));
		AnswerAnnotation annotation = AnswerAnnotation.ai(81L, 0, 2, 2, "grammar", "comment", "fix");
		when(gradingRepository.findBySubmissionModuleIdForUpdate(71L)).thenReturn(Optional.of(completed));

		boolean persisted = service.persistAiResult(aiResult, List.of(annotation));

		assertThat(persisted).isFalse();
		verify(gradingRepository, never()).saveAiGrade(aiResult);
		verify(answerAnnotationRepository, never()).save(annotation);
	}

	@Test
	void markFailedIfStillPending_changesOnlyPendingGrading() {
		Grading pending = grading(11L, GradingStatus.PENDING, null);
		when(gradingRepository.findBySubmissionModuleIdForUpdate(71L)).thenReturn(Optional.of(pending));

		service.markFailedIfStillPending(71L);

		verify(gradingRepository).updateStatus(11L, GradingStatus.FAILED);
	}

	@Test
	void markFailedIfStillPending_doesNotOverwriteCompletedGrading() {
		Grading completed = grading(11L, GradingStatus.COMPLETED, new BigDecimal("8.50"));
		when(gradingRepository.findBySubmissionModuleIdForUpdate(71L)).thenReturn(Optional.of(completed));

		service.markFailedIfStillPending(71L);

		verify(gradingRepository, never()).updateStatus(11L, GradingStatus.FAILED);
	}

	private Grading grading(Long id, GradingStatus status, BigDecimal score) {
		return new Grading(
				id,
				71L,
				GradingMethod.AUTO,
				status,
				null,
				score,
				null,
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				null);
	}
}
