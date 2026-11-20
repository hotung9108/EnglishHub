package com.english_hub.core.modules.report.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse.ScoreTimeline;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse.SkillAverage;
import com.english_hub.core.modules.report.domain.model.ReportStudentAttemptScore;
import com.english_hub.core.modules.report.domain.model.ReportStudentIdentity;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReportResponseBuilderTest {
	private final ReportCalculator calculator = new ReportCalculator();
	private final ReportResponseBuilder responseBuilder = new ReportResponseBuilder(
			calculator,
			new ReportCompletionCalculator(calculator));

	@Test
	void studentProgress_keepsResponseFieldsSkillOrderAndOneSkillTimelineOrder() {
		// Hành vi hiện tại cần giữ nguyên.
		ReportStudentIdentity student = new ReportStudentIdentity(55L, "Progress student");
		ReportSubmissionScore laterSubmission = submission(
				22L, 302L, "2026-09-02T12:00:00Z", "7", "10");
		ReportSubmissionScore earlierSubmission = submission(
				21L, 301L, "2026-09-01T12:00:00Z", "5", "10");
		List<ReportSubmissionScore> bestAttempts = List.of(laterSubmission, earlierSubmission);
		List<ReportStudentAttemptScore> attemptRows = List.of(
				attempt(22L, 302L, "2026-09-02T12:00:00Z", "Later assignment", "7", "10"),
				attempt(21L, 301L, "2026-09-01T12:00:00Z", "Earlier assignment", "5", "10"));
		List<ReportStudentSkillScore> skillRows = List.of(
				new ReportStudentSkillScore(22L, ModuleSkill.LISTENING,
						new BigDecimal("7"), new BigDecimal("10")),
				new ReportStudentSkillScore(21L, ModuleSkill.READING,
						new BigDecimal("5"), new BigDecimal("10")));

		ReportStudentProgressResponse response = responseBuilder.studentProgress(
				student, 44L, bestAttempts, attemptRows, skillRows);

		assertThat(response.studentId()).isEqualTo(55L);
		assertThat(response.studentName()).isEqualTo("Progress student");
		assertThat(response.classId()).isEqualTo(44L);

		List<SkillAverage> skillAverages = response.skillAverages();
		assertThat(skillAverages).extracting(SkillAverage::skill)
				.containsExactly(ModuleSkill.READING, ModuleSkill.LISTENING);
		assertThat(skillAverages.get(0).averageScorePercent()).isEqualByComparingTo("50.00");
		assertThat(skillAverages.get(1).averageScorePercent()).isEqualByComparingTo("70.00");

		List<ScoreTimeline> timeline = response.scoreTimeline();
		assertThat(timeline).extracting(ScoreTimeline::assignmentId).containsExactly(301L, 302L);
		assertThat(timeline).extracting(ScoreTimeline::title)
				.containsExactly("Earlier assignment", "Later assignment");
		assertThat(timeline).extracting(ScoreTimeline::submittedAt).containsExactly(
				OffsetDateTime.parse("2026-09-01T12:00:00Z"),
				OffsetDateTime.parse("2026-09-02T12:00:00Z"));
		assertThat(timeline.get(0).scorePercent()).isEqualByComparingTo("50.00");
		assertThat(timeline.get(1).scorePercent()).isEqualByComparingTo("70.00");
	}

	@Test
	void studentProgress_forFourSkillsAveragesSkillsEqually() {
		ReportStudentIdentity student = new ReportStudentIdentity(55L, "Progress student");
		ReportSubmissionScore bestAttempt = multiSkillSubmission(
				31L, 401L, "2026-09-03T12:00:00Z", "36", "50");
		List<ReportStudentAttemptScore> attemptRows = List.of(
				attempt(31L, 401L, "2026-09-03T12:00:00Z", "Four skill assignment", "36", "50"));
		List<ReportStudentSkillScore> skillRows = issueSkillRows(31L);

		ReportStudentProgressResponse response = responseBuilder.studentProgress(
				student, 44L, List.of(bestAttempt), attemptRows, skillRows);

		assertThat(response.skillAverages()).extracting(SkillAverage::skill)
				.containsExactly(ModuleSkill.READING, ModuleSkill.LISTENING, ModuleSkill.WRITING, ModuleSkill.SPEAKING);
		assertThat(response.skillAverages()).extracting(SkillAverage::averageScorePercent)
				.containsExactly(new BigDecimal("60.00"), new BigDecimal("40.00"),
						new BigDecimal("90.00"), new BigDecimal("80.00"));
		assertThat(response.scoreTimeline()).hasSize(1);
		assertThat(response.scoreTimeline().get(0).scorePercent()).isEqualByComparingTo("67.50");

		BigDecimal totalSkillAverage = BigDecimal.ZERO;
		for (SkillAverage skillAverage : response.skillAverages()) {
			totalSkillAverage = totalSkillAverage.add(skillAverage.averageScorePercent());
		}
		BigDecimal equalWeightedSkillAverage = totalSkillAverage
				.divide(BigDecimal.valueOf(response.skillAverages().size()));
		assertThat(equalWeightedSkillAverage)
				.isEqualByComparingTo(response.scoreTimeline().get(0).scorePercent());
	}

	@Test
	void studentProgress_keepsBestTotalAttemptForFourSkillTimeline() {
		ReportStudentIdentity student = new ReportStudentIdentity(55L, "Progress student");
		ReportSubmissionScore attemptA = multiSkillSubmission(
				41L, 402L, "2026-09-04T12:00:00Z", "38", "50");
		ReportSubmissionScore attemptB = multiSkillSubmission(
				42L, 402L, "2026-09-05T12:00:00Z", "34", "50");
		List<ReportSubmissionScore> bestAttempts = calculator.pickBestAttempts(List.of(attemptA, attemptB));
		List<ReportStudentAttemptScore> attemptRows = List.of(
				attempt(41L, 402L, "2026-09-04T12:00:00Z", "Two attempt assignment", "38", "50"),
				attempt(42L, 402L, "2026-09-05T12:00:00Z", "Two attempt assignment", "34", "50"));
		List<ReportStudentSkillScore> skillRows = List.of(
				skillRow(41L, ModuleSkill.WRITING, "20", "20"),
				skillRow(41L, ModuleSkill.SPEAKING, "6", "10"),
				skillRow(41L, ModuleSkill.READING, "6", "10"),
				skillRow(41L, ModuleSkill.LISTENING, "6", "10"),
				skillRow(42L, ModuleSkill.WRITING, "10", "20"),
				skillRow(42L, ModuleSkill.SPEAKING, "8", "10"),
				skillRow(42L, ModuleSkill.READING, "8", "10"),
				skillRow(42L, ModuleSkill.LISTENING, "8", "10"));

		assertThat(bestAttempts).extracting(ReportSubmissionScore::submissionId).containsExactly(41L);
		ReportStudentProgressResponse response = responseBuilder.studentProgress(
				student, 44L, bestAttempts, attemptRows, skillRows);

		assertThat(response.scoreTimeline()).hasSize(1);
		assertThat(response.scoreTimeline().get(0).assignmentId()).isEqualTo(402L);
		assertThat(response.scoreTimeline().get(0).scorePercent()).isEqualByComparingTo("70.00");
		assertThat(response.skillAverages()).extracting(SkillAverage::skill)
				.containsExactly(ModuleSkill.READING, ModuleSkill.LISTENING, ModuleSkill.WRITING, ModuleSkill.SPEAKING);
		assertThat(response.skillAverages()).extracting(SkillAverage::averageScorePercent)
				.containsExactly(new BigDecimal("60.00"), new BigDecimal("60.00"),
						new BigDecimal("100.00"), new BigDecimal("60.00"));
	}

	@Test
	void studentProgress_whenThereAreNoAttempts_returnsEmptySkillAndTimelineLists() {
		ReportStudentIdentity student = new ReportStudentIdentity(55L, "Progress student");

		ReportStudentProgressResponse response = responseBuilder.studentProgress(
				student, 44L, List.of(), List.of(), List.of());

		assertThat(response.studentId()).isEqualTo(55L);
		assertThat(response.studentName()).isEqualTo("Progress student");
		assertThat(response.classId()).isEqualTo(44L);
		assertThat(response.skillAverages()).isEmpty();
		assertThat(response.scoreTimeline()).isEmpty();
	}

	private ReportSubmissionScore submission(
			long submissionId,
			long assignmentId,
			String submittedAt,
			String score,
			String maximum) {
		return new ReportSubmissionScore(
				submissionId,
				assignmentId,
				44L,
				55L,
				OffsetDateTime.parse(submittedAt),
				new BigDecimal(score),
				new BigDecimal(maximum),
				1L,
				1L);
	}

	private ReportSubmissionScore multiSkillSubmission(
			long submissionId,
			long assignmentId,
			String submittedAt,
			String score,
			String maximum) {
		return new ReportSubmissionScore(
				submissionId,
				assignmentId,
				44L,
				55L,
				OffsetDateTime.parse(submittedAt),
				new BigDecimal(score),
				new BigDecimal(maximum),
				4L,
				4L);
	}

	private List<ReportStudentSkillScore> issueSkillRows(long submissionId) {
		return List.of(
				skillRow(submissionId, ModuleSkill.WRITING, "18", "20"),
				skillRow(submissionId, ModuleSkill.SPEAKING, "8", "10"),
				skillRow(submissionId, ModuleSkill.READING, "6", "10"),
				skillRow(submissionId, ModuleSkill.LISTENING, "4", "10"));
	}

	private ReportStudentSkillScore skillRow(long submissionId, ModuleSkill skill, String score, String maximum) {
		return new ReportStudentSkillScore(
				submissionId, skill, new BigDecimal(score), new BigDecimal(maximum));
	}

	private ReportStudentAttemptScore attempt(
			long submissionId,
			long assignmentId,
			String submittedAt,
			String assignmentTitle,
			String score,
			String maximum) {
		return new ReportStudentAttemptScore(
				submissionId,
				assignmentId,
				44L,
				55L,
				OffsetDateTime.parse(submittedAt),
				assignmentTitle,
				new BigDecimal(score),
				new BigDecimal(maximum),
				1L,
				1L);
	}
}
