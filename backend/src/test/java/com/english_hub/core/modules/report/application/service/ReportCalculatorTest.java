package com.english_hub.core.modules.report.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ReportCalculatorTest {
	private final ReportCalculator calculator = new ReportCalculator();

	@Test
	void pickBestAttempt_whenTwoAttempts_returnsHigherNormalizedScore() {
		ReportSubmissionScore lower = row(1, "2026-09-01T10:00:00Z", "45", "60", 2, 2);
		ReportSubmissionScore higher = row(2, "2026-09-02T10:00:00Z", "80", "100", 2, 2);

		assertThat(calculator.pickBestAttempts(List.of(lower, higher)))
				.extracting(ReportSubmissionScore::submissionId)
				.containsExactly(2L);
	}

	@Test
	void pickBestAttempt_whenScoresTie_returnsLatestSubmission() {
		ReportSubmissionScore earlier = row(1, "2026-09-01T10:00:00Z", "8", "10", 1, 1);
		ReportSubmissionScore later = row(2, "2026-09-02T10:00:00Z", "80", "100", 1, 1);

		assertThat(calculator.pickBestAttempts(List.of(earlier, later)))
				.extracting(ReportSubmissionScore::submissionId)
				.containsExactly(2L);
	}

	@Test
	void pickBestAttempt_whenScoreAndTimeTie_returnsHigherSubmissionId() {
		ReportSubmissionScore lowerId = row(4, "2026-09-02T10:00:00Z", "8", "10", 1, 1);
		ReportSubmissionScore higherId = row(5, "2026-09-02T10:00:00Z", "80", "100", 1, 1);

		assertThat(calculator.pickBestAttempts(List.of(lowerId, higherId)))
				.extracting(ReportSubmissionScore::submissionId)
				.containsExactly(5L);
	}

	@Test
	void pickBestAttempt_whenOneModuleIsIncomplete_ignoresAttempt() {
		ReportSubmissionScore incomplete = row(1, "2026-09-01T10:00:00Z", "10", "10", 2, 1);

		assertThat(calculator.pickBestAttempts(List.of(incomplete))).isEmpty();
	}

	@Test
	void averageScorePercent_whenModuleScalesDiffer_averagesNormalizedPairs() {
		ReportSubmissionScore fullSmallScale = row(1, "2026-09-01T10:00:00Z", "100", "100", 1, 1);
		ReportSubmissionScore zeroSmallScale = row(2, "2026-09-01T10:00:00Z", "0", "10", 1, 1);

		assertThat(calculator.averageScorePercent(List.of(fullSmallScale, zeroSmallScale)))
				.isEqualByComparingTo("50.00");
	}

	@Test
	void averageSkillScorePercent_usesOnlySelectedAttemptsAndNormalizesEachSkill() {
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.READING,
						new BigDecimal("8"), new BigDecimal("10")),
				new ReportStudentSkillScore(2L, ModuleSkill.READING,
						new BigDecimal("100"), new BigDecimal("100")),
				new ReportStudentSkillScore(2L, ModuleSkill.LISTENING,
						new BigDecimal("18"), new BigDecimal("20")));
		List<ReportSubmissionScore> best = List.of(
				row(2, "2026-09-02T10:00:00Z", "80", "100", 1, 1));

		Map<ModuleSkill, BigDecimal> averages = calculator.averageSkillScorePercent(rows, best);

		assertThat(averages).containsOnlyKeys(ModuleSkill.READING, ModuleSkill.LISTENING);
		assertThat(averages.get(ModuleSkill.READING)).isEqualByComparingTo("100.00");
		assertThat(averages.get(ModuleSkill.LISTENING)).isEqualByComparingTo("90.00");
	}

	@Test
	void percent_whenDenominatorIsZero_returnsZero() {
		assertThat(calculator.percent(BigDecimal.ONE, BigDecimal.ZERO)).isEqualByComparingTo("0.00");
	}

	private ReportSubmissionScore row(
			long id, String submittedAt, String score, String maximum, long moduleCount, long completedCount) {
		return new ReportSubmissionScore(
				id,
				1L,
				1L,
				10L,
				OffsetDateTime.parse(submittedAt),
				new BigDecimal(score),
				new BigDecimal(maximum),
				moduleCount,
				completedCount);
	}
}
