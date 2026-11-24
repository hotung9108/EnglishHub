package com.english_hub.core.modules.grading.infrastructure.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.modules.grading.domain.model.GradingMethod;
import com.english_hub.core.modules.grading.infrastructure.mapper.GradingPersistenceMapper;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GradingJpaAdapterTest {

	@Mock
	private com.english_hub.core.infrastructure.persistence.repository.GradingRepository jpaRepository;

	private GradingJpaAdapter adapter;

	@BeforeEach
	void setUp() {
		adapter = new GradingJpaAdapter(jpaRepository, new GradingPersistenceMapper());
	}

	@Test
	void saveAiSuggestionDoesNotWriteFinalGradeFields() {
		com.english_hub.core.infrastructure.persistence.entity.Grading target =
				new com.english_hub.core.infrastructure.persistence.entity.Grading(
						71L,
						com.english_hub.core.infrastructure.persistence.entity.GradingMethod.AUTO,
						GradingStatus.PENDING,
						null,
						null,
						null,
						new BigDecimal("10.00"),
						null,
						null,
						null,
						null,
						null);
		ReflectionTestUtils.setField(target, "id", 9L);
		when(jpaRepository.findBySubmissionModuleIdForUpdate(71L)).thenReturn(Optional.of(target));
		when(jpaRepository.save(target)).thenReturn(target);

		com.english_hub.core.modules.grading.domain.model.Grading aiSuggestion =
				new com.english_hub.core.modules.grading.domain.model.Grading(
						9L,
						71L,
						GradingMethod.AUTO,
						com.english_hub.core.modules.grading.domain.model.GradingStatus.AI_GRADED,
						"AI feedback",
						new BigDecimal("7.00"),
						"AI feedback must not become final feedback",
						new BigDecimal("10.00"),
						null,
						null,
						null,
						"{\"criteriaScores\":{\"overallScore\":7.0}}",
						null);

		adapter.saveAiGrade(aiSuggestion);

		assertThat(target.getFinalScore()).isNull();
		assertThat(target.getFinalFeedback()).isNull();
		assertThat(target.getGradedAt()).isNull();
		assertThat(target.getStatus()).isEqualTo(GradingStatus.AI_GRADED);
		assertThat(target.getAiFeedback()).isEqualTo("AI feedback");
		assertThat(target.getAiTranscript()).contains("\"overallScore\":7.0");
	}

	@Test
	void saveTeacherGradeFillsNullSnapshotFromValidatedDomainValue() {
		com.english_hub.core.infrastructure.persistence.entity.Grading target = entity(null);
		com.english_hub.core.modules.grading.domain.model.Grading source = domainGrading(new BigDecimal("10.00"));
		when(jpaRepository.findById(9L)).thenReturn(Optional.of(target));
		when(jpaRepository.save(target)).thenReturn(target);

		com.english_hub.core.modules.grading.domain.model.Grading saved = adapter.saveTeacherGrade(source);

		assertThat(target.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
		assertThat(saved.maxScoreSnapshot()).isEqualByComparingTo("10.00");
		verify(jpaRepository).save(target);
	}

	@Test
	void saveTeacherGradeDoesNotOverwriteExistingSnapshot() {
		com.english_hub.core.infrastructure.persistence.entity.Grading target = entity(new BigDecimal("10.00"));
		com.english_hub.core.modules.grading.domain.model.Grading source = domainGrading(new BigDecimal("12.00"));
		when(jpaRepository.findById(9L)).thenReturn(Optional.of(target));
		when(jpaRepository.save(target)).thenReturn(target);

		com.english_hub.core.modules.grading.domain.model.Grading saved = adapter.saveTeacherGrade(source);

		assertThat(target.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
		assertThat(saved.maxScoreSnapshot()).isEqualByComparingTo("10.00");
		verify(jpaRepository).save(target);
	}

	private com.english_hub.core.infrastructure.persistence.entity.Grading entity(BigDecimal maxScoreSnapshot) {
		com.english_hub.core.infrastructure.persistence.entity.Grading target =
				new com.english_hub.core.infrastructure.persistence.entity.Grading(
						71L,
						com.english_hub.core.infrastructure.persistence.entity.GradingMethod.TEACHER_MANUAL,
						GradingStatus.PENDING,
						null,
						null,
						null,
						maxScoreSnapshot,
						null,
						null,
						null,
						null,
						null);
		ReflectionTestUtils.setField(target, "id", 9L);
		return target;
	}

	private com.english_hub.core.modules.grading.domain.model.Grading domainGrading(BigDecimal maxScoreSnapshot) {
		return new com.english_hub.core.modules.grading.domain.model.Grading(
				9L,
				71L,
				GradingMethod.TEACHER_MANUAL,
				com.english_hub.core.modules.grading.domain.model.GradingStatus.COMPLETED,
				null,
				new BigDecimal("6.00"),
				"Teacher feedback",
				maxScoreSnapshot,
				20L,
				java.time.OffsetDateTime.parse("2026-10-11T10:00:00Z"),
				java.time.OffsetDateTime.parse("2026-10-11T10:00:00Z"),
				null,
				null);
	}
}
