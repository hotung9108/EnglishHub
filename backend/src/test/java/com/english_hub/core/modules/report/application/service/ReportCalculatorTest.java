package com.english_hub.core.modules.report.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
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
	void pickBestAttempts_whenSeveralStudentsAndAssignments_returnsBestForEachPair() {
		// Hành vi hiện tại cần giữ nguyên.
		List<ReportSubmissionScore> attempts = List.of(
				groupedRow(11, 101, 201, 501, "2026-09-01T10:00:00Z", "45", "60"),
				groupedRow(12, 101, 201, 501, "2026-09-02T10:00:00Z", "80", "100"),
				groupedRow(13, 102, 201, 501, "2026-09-03T10:00:00Z", "5", "10"),
				groupedRow(14, 101, 201, 502, "2026-09-04T10:00:00Z", "9", "10"));

		assertThat(calculator.pickBestAttempts(attempts))
				.extracting(ReportSubmissionScore::submissionId)
				.containsExactlyInAnyOrder(12L, 13L, 14L);
	}

	@Test
	void pickBestAttempt_whenAttemptHasZeroModules_ignoresAttempt() {
		// Hành vi hiện tại cần giữ nguyên.
		ReportSubmissionScore noModules = row(1, "2026-09-01T10:00:00Z", "0", "0", 0, 0);

		assertThat(calculator.pickBestAttempts(List.of(noModules))).isEmpty();
	}

	@Test
	void pickBestAttempt_forFourSkillFixture_usesHighestTotalRatio() {
		// Hành vi hiện tại cần giữ nguyên. A = 38/50; B = 34/50.
		// A: Writing 20/20, ba kỹ năng còn lại mỗi kỹ năng 6/10.
		// B: Writing 10/20, ba kỹ năng còn lại mỗi kỹ năng 8/10.
		ReportSubmissionScore attemptA = row(1, "2026-09-01T10:00:00Z", "38", "50", 4, 4);
		ReportSubmissionScore attemptB = row(2, "2026-09-02T10:00:00Z", "34", "50", 4, 4);

		assertThat(calculator.pickBestAttempts(List.of(attemptA, attemptB)))
				.extracting(ReportSubmissionScore::submissionId)
				.containsExactly(1L);
	}

	@Test
	void averageScorePercent_whenModuleScalesDiffer_averagesNormalizedPairs() {
		ReportSubmissionScore fullSmallScale = row(1, "2026-09-01T10:00:00Z", "100", "100", 1, 1);
		ReportSubmissionScore zeroSmallScale = row(2, "2026-09-01T10:00:00Z", "0", "10", 1, 1);

		assertThat(calculator.averageScorePercent(List.of(fullSmallScale, zeroSmallScale)))
				.isEqualByComparingTo("50.00");
	}

	@Test
	void averageScorePercent_whenRowsAreEmpty_returnsZero() {
		// Hành vi hiện tại cần giữ nguyên.
		assertThat(calculator.averageScorePercent(List.of())).isEqualByComparingTo("0.00");
	}

	@Test
	void averageScorePercent_currentBehavior_zeroMaximumReturnsZero() {
		// Hành vi hiện tại cần giữ nguyên; đáng ngờ, không bảo đảm đúng.
		ReportSubmissionScore zeroMaximum = row(1, "2026-09-01T10:00:00Z", "5", "0", 1, 1);

		assertThat(calculator.averageScorePercent(List.of(zeroMaximum))).isEqualByComparingTo("0.00");
	}

	@Test
	void averageScorePercent_whenScoreIsZero_returnsZero() {
		// Hành vi hiện tại cần giữ nguyên.
		ReportSubmissionScore zeroScore = row(1, "2026-09-01T10:00:00Z", "0", "10", 1, 1);

		assertThat(calculator.averageScorePercent(List.of(zeroScore))).isEqualByComparingTo("0.00");
	}

	@Test
	void averageScorePercent_whenScoreEqualsMaximum_returnsOneHundred() {
		// Hành vi hiện tại cần giữ nguyên.
		ReportSubmissionScore maximumScore = row(1, "2026-09-01T10:00:00Z", "10", "10", 1, 1);

		assertThat(calculator.averageScorePercent(List.of(maximumScore))).isEqualByComparingTo("100.00");
	}

	@Test
	void averageScorePercent_whenThirdDecimalIsFive_roundsUpHalfUp() {
		// Hành vi hiện tại cần giữ nguyên.
		ReportSubmissionScore halfHundredth = row(
				1, "2026-09-01T10:00:00Z", "2.001", "20", 1, 1);

		assertThat(calculator.averageScorePercent(List.of(halfHundredth))).isEqualByComparingTo("10.01");
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
	void averageSkillScorePercent_whenSameSkillAppearsInSeveralSubmissions_averagesRowRatios() {
		// Hành vi hiện tại cần giữ nguyên.
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.READING,
						new BigDecimal("100"), new BigDecimal("100")),
				new ReportStudentSkillScore(2L, ModuleSkill.READING,
						BigDecimal.ZERO, new BigDecimal("10")));
		List<ReportSubmissionScore> selectedAttempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "100", "100", 1, 1),
				row(2, "2026-09-02T10:00:00Z", "0", "10", 1, 1));

		Map<ModuleSkill, BigDecimal> averages = calculator.averageSkillScorePercent(rows, selectedAttempts);

		assertThat(averages).containsOnlyKeys(ModuleSkill.READING);
		assertThat(averages.get(ModuleSkill.READING)).isEqualByComparingTo("50.00");
	}

	@Test
	void averageSkillScorePercent_whenOneSkillIsMissing_returnsOtherThreeSkills() {
		// Hành vi hiện tại cần giữ nguyên.
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.READING, new BigDecimal("8"), new BigDecimal("10")),
				new ReportStudentSkillScore(1L, ModuleSkill.LISTENING, new BigDecimal("7"), new BigDecimal("10")),
				new ReportStudentSkillScore(1L, ModuleSkill.WRITING, new BigDecimal("9"), new BigDecimal("10")));
		List<ReportSubmissionScore> selectedAttempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "24", "30", 3, 3));

		Map<ModuleSkill, BigDecimal> averages = calculator.averageSkillScorePercent(rows, selectedAttempts);

		assertThat(averages.keySet()).containsExactly(
				ModuleSkill.READING, ModuleSkill.LISTENING, ModuleSkill.WRITING);
	}

	@Test
	void averageSkillScorePercent_whenTwoSkillsAreMissing_returnsOtherTwoSkills() {
		// Hành vi hiện tại cần giữ nguyên.
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.READING, new BigDecimal("8"), new BigDecimal("10")),
				new ReportStudentSkillScore(1L, ModuleSkill.LISTENING, new BigDecimal("7"), new BigDecimal("10")));
		List<ReportSubmissionScore> selectedAttempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "15", "20", 2, 2));

		Map<ModuleSkill, BigDecimal> averages = calculator.averageSkillScorePercent(rows, selectedAttempts);

		assertThat(averages.keySet()).containsExactly(ModuleSkill.READING, ModuleSkill.LISTENING);
	}

	@Test
	void averageSkillScorePercent_whenThreeSkillsAreMissing_returnsRemainingSkill() {
		// Hành vi hiện tại cần giữ nguyên.
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.SPEAKING, new BigDecimal("6"), new BigDecimal("10")));
		List<ReportSubmissionScore> selectedAttempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "6", "10", 1, 1));

		Map<ModuleSkill, BigDecimal> averages = calculator.averageSkillScorePercent(rows, selectedAttempts);

		assertThat(averages.keySet()).containsExactly(ModuleSkill.SPEAKING);
	}

	@Test
	void averageSkillScorePercent_whenRowsAreEmpty_returnsEmptyMap() {
		// Hành vi hiện tại cần giữ nguyên.
		assertThat(calculator.averageSkillScorePercent(List.of(), List.of())).isEmpty();
	}

	@Test
	void averageSkillScorePercent_currentBehavior_zeroMaximumReturnsZero() {
		// Hành vi hiện tại cần giữ nguyên; đáng ngờ, không bảo đảm đúng.
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.READING,
						new BigDecimal("5"), BigDecimal.ZERO));
		List<ReportSubmissionScore> selectedAttempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "5", "10", 1, 1));

		assertThat(calculator.averageSkillScorePercent(rows, selectedAttempts)
				.get(ModuleSkill.READING)).isEqualByComparingTo("0.00");
	}

	@Test
	void averageSkillScorePercent_whenRowsArriveOutOfOrder_returnsEnumOrder() {
		// Hành vi hiện tại cần giữ nguyên.
		List<ReportStudentSkillScore> rows = List.of(
				new ReportStudentSkillScore(1L, ModuleSkill.SPEAKING, new BigDecimal("8"), new BigDecimal("10")),
				new ReportStudentSkillScore(1L, ModuleSkill.WRITING, new BigDecimal("7"), new BigDecimal("10")),
				new ReportStudentSkillScore(1L, ModuleSkill.LISTENING, new BigDecimal("9"), new BigDecimal("10")),
				new ReportStudentSkillScore(1L, ModuleSkill.READING, new BigDecimal("6"), new BigDecimal("10")));
		List<ReportSubmissionScore> selectedAttempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "30", "40", 4, 4));

		Map<ModuleSkill, BigDecimal> averages = calculator.averageSkillScorePercent(rows, selectedAttempts);

		assertThat(new ArrayList<>(averages.keySet())).containsExactly(
				ModuleSkill.READING, ModuleSkill.LISTENING, ModuleSkill.WRITING, ModuleSkill.SPEAKING);
	}

	@Test
	void averageSkillRatiosBySkill_forFourDifferentScales_returnsUnroundedRatios() {
		List<ReportStudentSkillScore> skillRows = issueSkillRows(1);
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "36", "50", 4, 4);

		Map<ModuleSkill, BigDecimal> ratios = calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));

		assertThat(ratios.get(ModuleSkill.WRITING)).isEqualByComparingTo("0.9");
		assertThat(ratios.get(ModuleSkill.SPEAKING)).isEqualByComparingTo("0.8");
		assertThat(ratios.get(ModuleSkill.READING)).isEqualByComparingTo("0.6");
		assertThat(ratios.get(ModuleSkill.LISTENING)).isEqualByComparingTo("0.4");
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("67.50");
	}

	@Test
	void attemptScorePercent_whenAllSkillsAreMaximum_returnsOneHundred() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "20", "20"),
				skillRow(1, ModuleSkill.SPEAKING, "10", "10"),
				skillRow(1, ModuleSkill.READING, "10", "10"),
				skillRow(1, ModuleSkill.LISTENING, "10", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "50", "50", 4, 4);

		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("100.00");
	}

	@Test
	void attemptScorePercent_whenAllSkillsAreZero_returnsZero() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "0", "20"),
				skillRow(1, ModuleSkill.SPEAKING, "0", "10"),
				skillRow(1, ModuleSkill.READING, "0", "10"),
				skillRow(1, ModuleSkill.LISTENING, "0", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "0", "50", 4, 4);

		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("0.00");
	}

	@Test
	void attemptScorePercent_whenOneSkillIsMissing_averagesAvailableSkills() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "9", "10"),
				skillRow(1, ModuleSkill.SPEAKING, "7", "10"),
				skillRow(1, ModuleSkill.READING, "8", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "24", "30", 3, 3);

		Map<ModuleSkill, BigDecimal> ratios = calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));

		assertThat(ratios).containsOnlyKeys(ModuleSkill.WRITING, ModuleSkill.SPEAKING, ModuleSkill.READING);
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("80.00");
	}

	@Test
	void attemptScorePercent_whenTwoSkillsAreMissing_averagesAvailableSkills() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "9", "10"),
				skillRow(1, ModuleSkill.READING, "7", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "16", "20", 2, 2);

		Map<ModuleSkill, BigDecimal> ratios = calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));

		assertThat(ratios).containsOnlyKeys(ModuleSkill.WRITING, ModuleSkill.READING);
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("80.00");
	}

	@Test
	void attemptScorePercent_whenThreeSkillsAreMissing_usesRemainingSkill() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.SPEAKING, "6", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "6", "10", 1, 1);

		Map<ModuleSkill, BigDecimal> ratios = calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));

		assertThat(ratios).containsOnlyKeys(ModuleSkill.SPEAKING);
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("60.00");
	}

	@Test
	void attemptScorePercent_whenNoSkillsArePresent_returnsZero() {
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "0", "0", 1, 1);

		assertThat(calculator.averageSkillRatiosBySkill(List.of(), List.of(attempt))).isEmpty();
		assertThat(calculator.attemptScorePercent(attempt, List.of())).isEqualByComparingTo("0.00");
	}

	@Test
	void attemptScorePercent_whenOnlyOneSkillIsPresent_usesThatSkillRatio() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "5", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "5", "10", 1, 1);

		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("50.00");
	}

	@Test
	void averageSkillRatiosBySkill_whenSameSkillAppearsInSeveralSubmissions_averagesRowRatios() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "100", "100"),
				skillRow(2, ModuleSkill.READING, "0", "10"));
		List<ReportSubmissionScore> attempts = List.of(
				row(1, "2026-09-01T10:00:00Z", "100", "100", 1, 1),
				row(2, "2026-09-02T10:00:00Z", "0", "10", 1, 1));

		Map<ModuleSkill, BigDecimal> ratios = calculator.averageSkillRatiosBySkill(skillRows, attempts);

		assertThat(ratios.get(ModuleSkill.READING)).isEqualByComparingTo("0.5");
		assertThat(calculator.averageSkillScorePercent(skillRows, attempts)
				.get(ModuleSkill.READING)).isEqualByComparingTo("50.00");
	}

	@Test
	void attemptScorePercent_whenSkillMaximumIsZero_usesZeroRatio() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "5", "0"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "5", "10", 1, 1);

		assertThat(calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt))
				.get(ModuleSkill.READING)).isEqualByComparingTo("0");
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("0.00");
	}

	@Test
	void attemptScorePercent_whenMeanIs67Point125_roundsUpHalfUp() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "6750", "10000"),
				skillRow(1, ModuleSkill.SPEAKING, "6700", "10000"),
				skillRow(1, ModuleSkill.READING, "6700", "10000"),
				skillRow(1, ModuleSkill.LISTENING, "6700", "10000"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "26850", "40000", 4, 4);

		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("67.13");
	}

	@Test
	void attemptScorePercent_whenMeanIs67Point124_roundsDownHalfUp() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "67496", "100000"),
				skillRow(1, ModuleSkill.SPEAKING, "67000", "100000"),
				skillRow(1, ModuleSkill.READING, "67000", "100000"),
				skillRow(1, ModuleSkill.LISTENING, "67000", "100000"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "268496", "400000", 4, 4);

		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("67.12");
	}

	@Test
	void attemptScorePercent_matchesMeanOfUnroundedSkillAverages() {
		List<ReportStudentSkillScore> skillRows = issueSkillRows(1);
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "36", "50", 4, 4);
		Map<ModuleSkill, BigDecimal> ratios = calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));
		BigDecimal totalRatio = BigDecimal.ZERO;
		for (BigDecimal ratio : ratios.values()) {
			totalRatio = totalRatio.add(ratio);
		}
		BigDecimal meanPercentBeforeRounding = totalRatio
				.divide(BigDecimal.valueOf(ratios.size()), MathContext.DECIMAL128)
				.multiply(new BigDecimal("100"));

		assertThat(meanPercentBeforeRounding).isEqualByComparingTo("67.5");
		assertThat(calculator.attemptScorePercent(attempt, skillRows))
				.isEqualByComparingTo(meanPercentBeforeRounding.setScale(2, RoundingMode.HALF_UP));
	}

	@Test
	void overallScoreOnTen_forIssueSkillScores_returnsSixPointEight() {
		List<ReportStudentSkillScore> skillRows = issueSkillRows(1);
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "36", "50", 4, 4);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("6.8");
	}

	@Test
	void overallScoreOnTen_whenEverySkillIsAtMaximum_returnsTen() {
		List<ReportStudentSkillScore> skillRows = fourSkillRows(1, "10", "10");
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "40", "40", 4, 4);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("10.0");
	}

	@Test
	void overallScoreOnTen_whenEverySkillIsZero_returnsZero() {
		List<ReportStudentSkillScore> skillRows = fourSkillRows(1, "0", "10");
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "0", "40", 4, 4);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("0.0");
	}

	@Test
	void overallScoreOnTen_forSyntheticEightPointFiveVector_returnsEightPointFive() {
		// Synthetic vector from the acceptance example; no source score vector was provided.
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "8", "10"),
				skillRow(1, ModuleSkill.LISTENING, "8", "10"),
				skillRow(1, ModuleSkill.WRITING, "9", "10"),
				skillRow(1, ModuleSkill.SPEAKING, "9", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "34", "40", 4, 4);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("8.5");
	}

	@Test
	void overallScoreOnTen_forSyntheticSevenPointThreeVector_returnsSevenPointThree() {
		// Synthetic vector from the acceptance example; no source score vector was provided.
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "70", "100"),
				skillRow(1, ModuleSkill.LISTENING, "72", "100"),
				skillRow(1, ModuleSkill.WRITING, "74", "100"),
				skillRow(1, ModuleSkill.SPEAKING, "76", "100"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "292", "400", 4, 4);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("7.3");
	}

	@Test
	void overallScoreOnTen_whenOneSkillIsMissing_averagesThreeAvailableSkills() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "9", "10"),
				skillRow(1, ModuleSkill.LISTENING, "8", "10"),
				skillRow(1, ModuleSkill.WRITING, "6", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "23", "30", 3, 3);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("7.7");
	}

	@Test
	void overallScoreOnTen_whenTwoSkillsAreMissing_averagesTwoAvailableSkills() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "9", "10"),
				skillRow(1, ModuleSkill.LISTENING, "8", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "17", "20", 2, 2);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("8.5");
	}

	@Test
	void overallScoreOnTen_whenThreeSkillsAreMissing_usesRemainingSkill() {
		List<ReportStudentSkillScore> skillRows = List.of(skillRow(1, ModuleSkill.SPEAKING, "7", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "7", "10", 1, 1);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("7.0");
	}

	@Test
	void overallScoreOnTen_whenNoSkillsAreAvailable_returnsNull() {
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "0", "0", 1, 1);
		assertThat(calculator.overallScoreOnTen(List.of(), List.of(attempt))).isNull();
	}

	@Test
	void overallScoreOnTen_whenOnlyOneSkillIsAvailable_usesItsRatio() {
		List<ReportStudentSkillScore> skillRows = List.of(skillRow(1, ModuleSkill.READING, "0.85", "1"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "0.85", "1", 1, 1);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("8.5");
	}

	@Test
	void overallScoreOnTen_whenSkillMaximumIsZero_usesZeroRatio() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "5", "0"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "5", "0", 1, 1);
		Map<ModuleSkill, BigDecimal> skillRatios =
				calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));

		assertThat(skillRatios).containsEntry(ModuleSkill.READING, BigDecimal.ZERO);
		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("0.0");
	}

	@Test
	void overallScoreOnTen_whenSkillRatiosRepeat_doesNotRoundSkillsBeforeAveraging() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "2", "3"),
				skillRow(1, ModuleSkill.LISTENING, "67", "90"),
				skillRow(1, ModuleSkill.WRITING, "67", "90"),
				skillRow(1, ModuleSkill.SPEAKING, "67", "90"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "203", "273", 4, 4);
		Map<ModuleSkill, BigDecimal> skillRatios =
				calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));
		Map<ModuleSkill, BigDecimal> roundedSkillAverages =
				calculator.averageSkillScorePercent(skillRows, List.of(attempt));
		BigDecimal totalRoundedSkillAverage = BigDecimal.ZERO;
		for (BigDecimal skillAverage : roundedSkillAverages.values()) {
			totalRoundedSkillAverage = totalRoundedSkillAverage.add(skillAverage);
		}
		BigDecimal averageRoundedSkillScoreOnTen = totalRoundedSkillAverage
				.divide(BigDecimal.valueOf(roundedSkillAverages.size()), MathContext.DECIMAL128)
				.divide(BigDecimal.TEN, MathContext.DECIMAL128)
				.setScale(1, RoundingMode.HALF_UP);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("7.3");
		assertThat(averageRoundedSkillScoreOnTen).isEqualByComparingTo("7.2");
	}

	@Test
	void overallScoreOnTen_matchesMeanSkillAveragesOnTenBeforeFinalRounding() {
		List<ReportStudentSkillScore> skillRows = issueSkillRows(1);
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "36", "50", 4, 4);
		Map<ModuleSkill, BigDecimal> skillRatios =
				calculator.averageSkillRatiosBySkill(skillRows, List.of(attempt));
		Map<ModuleSkill, BigDecimal> skillAverages =
				calculator.averageSkillScorePercent(skillRows, List.of(attempt));
		BigDecimal totalSkillAverage = BigDecimal.ZERO;
		for (BigDecimal skillAverage : skillAverages.values()) {
			totalSkillAverage = totalSkillAverage.add(skillAverage);
		}
		BigDecimal meanSkillAverageOnTen = totalSkillAverage
				.divide(BigDecimal.valueOf(skillAverages.size()), MathContext.DECIMAL128)
				.divide(BigDecimal.TEN, MathContext.DECIMAL128);
		BigDecimal expectedOverallScore = meanSkillAverageOnTen.setScale(1, RoundingMode.HALF_UP);

		assertThat(meanSkillAverageOnTen).isEqualByComparingTo("6.75");
		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo(expectedOverallScore);
	}

	@Test
	void overallScoreOnTen_roundsExactHalfUpBoundariesAndDoesNotRoundUpBeforeTie() {
		assertThat(overallScoreForRepeatedRatio("29", "40")).isEqualByComparingTo("7.3");
		assertThat(overallScoreForRepeatedRatio("72499", "100000")).isEqualByComparingTo("7.2");
		assertThat(overallScoreForRepeatedRatio("27", "40")).isEqualByComparingTo("6.8");
		assertThat(overallScoreForRepeatedRatio("337", "500")).isEqualByComparingTo("6.7");
	}

	@Test
	void attemptScorePercent_whenRepeatedRatiosTieAtThirdDecimal_roundsHalfUpExactly() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "2", "3"),
				skillRow(1, ModuleSkill.LISTENING, "1211", "1800"),
				skillRow(1, ModuleSkill.WRITING, "1211", "1800"),
				skillRow(1, ModuleSkill.SPEAKING, "1211", "1800"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "3635", "5403", 4, 4);

		// 2/3 + 3*(1211/1800) = 4833/1800 = 2.685; /4*100 = 67.125, so HALF_UP gives 67.13.
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("67.13");
	}

	@Test
	void attemptScorePercent_whenExactValueIsJustBelowHalfBoundary_doesNotRoundUpEarly() {
		List<ReportStudentSkillScore> skillRows = fourSkillRows(1, "72499", "100000");
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "289996", "400000", 4, 4);

		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("72.50");
		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("7.2");
	}

	@Test
	void attemptScorePercentAndOverallScoreOnTen_useSameExactMeanForFiniteRatios() {
		List<ReportStudentSkillScore> skillRows = fourSkillRows(1, "7", "10");
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "28", "40", 4, 4);
		BigDecimal timelinePercent = calculator.attemptScorePercent(attempt, skillRows);
		BigDecimal overallScore = calculator.overallScoreOnTen(skillRows, List.of(attempt));

		assertThat(overallScore).isEqualByComparingTo("7.0");
		assertThat(timelinePercent).isEqualByComparingTo("70.00");
		assertThat(overallScore.multiply(BigDecimal.TEN)).isEqualByComparingTo(timelinePercent);
	}

	@Test
	void overallScoreOnTen_andTimeline_supportFractionalScoresAndDifferentMaximums() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.WRITING, "18.33", "20"),
				skillRow(1, ModuleSkill.SPEAKING, "8.5", "10"),
				skillRow(1, ModuleSkill.READING, "6", "10"),
				skillRow(1, ModuleSkill.LISTENING, "4", "10"));
		ReportSubmissionScore attempt = row(1, "2026-09-01T10:00:00Z", "37.83", "50", 4, 4);

		assertThat(calculator.overallScoreOnTen(skillRows, List.of(attempt))).isEqualByComparingTo("6.9");
		assertThat(calculator.attemptScorePercent(attempt, skillRows)).isEqualByComparingTo("69.16");
	}

	@Test
	void overallScoreOnTen_whenSameSkillAppearsAcrossAttemptsAveragesAttemptRatios() {
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(1, ModuleSkill.READING, "100", "100"),
				skillRow(2, ModuleSkill.READING, "0", "10"));
		ReportSubmissionScore firstAttempt = groupedRow(
				1, 101, 201, 501, "2026-09-01T10:00:00Z", "100", "100");
		ReportSubmissionScore secondAttempt = groupedRow(
				2, 102, 201, 501, "2026-09-02T10:00:00Z", "0", "10");
		List<ReportSubmissionScore> selectedAttempts = List.of(firstAttempt, secondAttempt);

		// (100/100 + 0/10) / 2 = 0.5, so the overall score is 5.0/10.
		assertThat(calculator.overallScoreOnTen(skillRows, selectedAttempts)).isEqualByComparingTo("5.0");
		assertThat(calculator.averageSkillScorePercent(skillRows, selectedAttempts)
				.get(ModuleSkill.READING)).isEqualByComparingTo("50.00");
	}

	@Test
	void averageScoreByClass_whenStudentsAssignmentsAndAttemptsAreGrouped_averagesBestAttemptRatios() {
		// Hành vi hiện tại cần giữ nguyên.
		Map<Long, BigDecimal> averages = calculator.averageScoreByClass(bestGroupedAttempts());

		assertThat(averages.get(101L)).isEqualByComparingTo("77.50");
		assertThat(averages.get(202L)).isEqualByComparingTo("55.00");
	}

	@Test
	void averageScoreByStudent_whenAssignmentsAndAttemptsAreGrouped_averagesBestAttemptRatios() {
		// Hành vi hiện tại cần giữ nguyên.
		Map<Long, BigDecimal> averages = calculator.averageScoreByStudent(bestGroupedAttempts());

		assertThat(averages.get(501L)).isEqualByComparingTo("75.00");
		assertThat(averages.get(502L)).isEqualByComparingTo("73.33");
		assertThat(averages.get(503L)).isEqualByComparingTo("50.00");
	}

	@Test
	void averageScoreByAssignment_whenStudentsAndAttemptsAreGrouped_averagesBestAttemptRatios() {
		// Hành vi hiện tại cần giữ nguyên.
		Map<Long, BigDecimal> averages = calculator.averageScoreByAssignment(bestGroupedAttempts());

		assertThat(averages.get(201L)).isEqualByComparingTo("85.00");
		assertThat(averages.get(202L)).isEqualByComparingTo("70.00");
		assertThat(averages.get(203L)).isEqualByComparingTo("55.00");
	}

	@Test
	void percent_whenDenominatorIsZero_returnsZero() {
		assertThat(calculator.percent(BigDecimal.ONE, BigDecimal.ZERO)).isEqualByComparingTo("0.00");
	}

	@Test
	void percent_whenThirdDecimalIsFive_roundsUpHalfUp() {
		// Hành vi hiện tại cần giữ nguyên.
		assertThat(calculator.percent(new BigDecimal("1.2345"), new BigDecimal("10")))
				.isEqualByComparingTo("12.35");
	}

	private List<ReportSubmissionScore> bestGroupedAttempts() {
		List<ReportSubmissionScore> attempts = List.of(
				groupedRow(1, 201, 101, 501, "2026-09-01T10:00:00Z", "70", "100"),
				groupedRow(2, 201, 101, 501, "2026-09-02T10:00:00Z", "90", "100"),
				groupedRow(3, 201, 101, 502, "2026-09-03T10:00:00Z", "80", "100"),
				groupedRow(4, 202, 101, 501, "2026-09-04T10:00:00Z", "60", "100"),
				groupedRow(5, 202, 101, 502, "2026-09-05T10:00:00Z", "40", "50"),
				groupedRow(6, 203, 202, 502, "2026-09-06T10:00:00Z", "60", "100"),
				groupedRow(7, 203, 202, 503, "2026-09-07T10:00:00Z", "50", "100"));

		return calculator.pickBestAttempts(attempts);
	}

	private List<ReportStudentSkillScore> issueSkillRows(long submissionId) {
		return List.of(
				skillRow(submissionId, ModuleSkill.WRITING, "18", "20"),
				skillRow(submissionId, ModuleSkill.SPEAKING, "8", "10"),
				skillRow(submissionId, ModuleSkill.READING, "6", "10"),
				skillRow(submissionId, ModuleSkill.LISTENING, "4", "10"));
	}

	private BigDecimal overallScoreForRepeatedRatio(String score, String maximum) {
		List<ReportStudentSkillScore> skillRows = fourSkillRows(1, score, maximum);
		BigDecimal totalScore = new BigDecimal(score).multiply(BigDecimal.valueOf(4));
		BigDecimal totalMaximum = new BigDecimal(maximum).multiply(BigDecimal.valueOf(4));
		ReportSubmissionScore attempt = row(
				1, "2026-09-01T10:00:00Z", totalScore.toPlainString(), totalMaximum.toPlainString(), 4, 4);
		return calculator.overallScoreOnTen(skillRows, List.of(attempt));
	}

	private List<ReportStudentSkillScore> fourSkillRows(long submissionId, String score, String maximum) {
		return List.of(
				skillRow(submissionId, ModuleSkill.READING, score, maximum),
				skillRow(submissionId, ModuleSkill.LISTENING, score, maximum),
				skillRow(submissionId, ModuleSkill.WRITING, score, maximum),
				skillRow(submissionId, ModuleSkill.SPEAKING, score, maximum));
	}

	private ReportStudentSkillScore skillRow(long submissionId, ModuleSkill skill, String score, String maximum) {
		return new ReportStudentSkillScore(
				submissionId, skill, new BigDecimal(score), new BigDecimal(maximum));
	}

	private ReportSubmissionScore groupedRow(
			long submissionId,
			long assignmentId,
			long classId,
			long studentId,
			String submittedAt,
			String score,
			String maximum) {
		return new ReportSubmissionScore(
				submissionId,
				assignmentId,
				classId,
				studentId,
				OffsetDateTime.parse(submittedAt),
				new BigDecimal(score),
				new BigDecimal(maximum),
				1L,
				1L);
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
