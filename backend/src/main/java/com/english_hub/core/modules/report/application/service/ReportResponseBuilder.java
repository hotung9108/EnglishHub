package com.english_hub.core.modules.report.application.service;

import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse.ScoreTimeline;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse.SkillAverage;
import com.english_hub.core.modules.report.application.model.ReportClassListResponse;
import com.english_hub.core.modules.report.application.model.ReportClassProgressResponse;
import com.english_hub.core.modules.report.application.model.ReportCompletionRows;
import com.english_hub.core.modules.report.application.model.ReportOverviewResponse;
import com.english_hub.core.modules.report.application.model.ReportPaginationResponse;
import com.english_hub.core.modules.report.application.model.ReportClassProgressResponse.AssignmentScore;
import com.english_hub.core.modules.report.application.model.ReportClassProgressResponse.StudentProgress;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentRow;
import com.english_hub.core.modules.report.domain.model.ReportClassRow;
import com.english_hub.core.modules.report.domain.model.ReportClassPage;
import com.english_hub.core.modules.report.domain.model.ReportMemberRow;
import com.english_hub.core.modules.report.domain.model.ReportPendingByStatus;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import com.english_hub.core.modules.report.domain.model.ReportStudentAttemptScore;
import com.english_hub.core.modules.report.domain.model.ReportStudentIdentity;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ReportResponseBuilder {
	private static final List<GradingStatus> PENDING_STATUSES =
			List.of(GradingStatus.PENDING, GradingStatus.AI_GRADED, GradingStatus.FAILED);

	private final ReportCalculator calculator;
	private final ReportCompletionCalculator completionCalculator;

	public ReportResponseBuilder(
			ReportCalculator calculator,
			ReportCompletionCalculator completionCalculator) {
		this.calculator = calculator;
		this.completionCalculator = completionCalculator;
	}

	public ReportOverviewResponse overview(
			long classCount,
			List<Long> classIds,
			ReportCompletionRows completion,
			List<ReportSubmissionScore> bestScores,
			List<ReportPendingByStatus> pendingRows) {
		Map<GradingStatus, Long> pending = pendingByStatus(pendingRows);
		return new ReportOverviewResponse(
				classCount,
				completionCalculator.sumAssignments(completion.assignments()),
				completionCalculator.completionPercent(classIds, completion),
				calculator.averageScorePercent(bestScores),
				sumPending(pending),
				pending);
	}

	public ReportStudentProgressResponse studentProgress(
			ReportStudentIdentity student,
			Long classId,
			List<ReportSubmissionScore> bestAttempts,
			List<ReportStudentAttemptScore> attemptRows,
			List<ReportStudentSkillScore> skillRows) {
		Map<Long, ReportStudentAttemptScore> attemptsById = new HashMap<>();
		for (ReportStudentAttemptScore attempt : attemptRows) {
			attemptsById.put(attempt.submissionId(), attempt);
		}
		List<ScoreTimeline> timeline = new ArrayList<>();
		for (ReportSubmissionScore best : bestAttempts) {
			ReportStudentAttemptScore attempt = attemptsById.get(best.submissionId());
			timeline.add(new ScoreTimeline(best.assignmentId(), attempt.assignmentTitle(), utc(best.submittedAt()),
					calculator.averageScorePercent(List.of(best))));
		}
		timeline.sort(Comparator.comparing(ScoreTimeline::submittedAt,
				Comparator.nullsFirst(Comparator.naturalOrder())));
		List<SkillAverage> skills = new ArrayList<>();
		for (Map.Entry<com.english_hub.core.infrastructure.persistence.entity.ModuleSkill, BigDecimal> entry
				: calculator.averageSkillScorePercent(skillRows, bestAttempts).entrySet()) {
			skills.add(new SkillAverage(entry.getKey(), entry.getValue()));
		}
		return new ReportStudentProgressResponse(student.studentId(), student.studentName(), classId, skills, timeline);
	}

	public ReportClassListResponse classes(
			ReportClassPage page,
			int pageNumber,
			int limit,
			ReportCompletionRows completion,
			List<ReportSubmissionScore> bestScores) {
		Map<Long, BigDecimal> scores = calculator.averageScoreByClass(bestScores);
		List<ReportClassListResponse.ClassSummary> summaries = new ArrayList<>();
		for (ReportClassRow row : page.classes()) {
			summaries.add(new ReportClassListResponse.ClassSummary(
					row.classId(), row.className(), row.status(),
					completionCalculator.countForClass(completion.assignments(), row.classId()),
					scores.getOrDefault(row.classId(), zero()),
					completionCalculator.completionPercentForClass(row.classId(), completion)));
		}
		return new ReportClassListResponse(
				summaries,
				new ReportPaginationResponse(pageNumber, limit, page.total()));
	}

	public ReportClassProgressResponse classProgress(
			long classId,
			BigDecimal threshold,
			ReportCompletionRows completion,
			List<ReportMemberRow> members,
			List<ReportAssignmentRow> assignments,
			Map<Long, Long> completedByStudent,
			List<ReportSubmissionScore> bestScores) {
		Map<Long, BigDecimal> scoreByStudent = calculator.averageScoreByStudent(bestScores);
		Map<Long, BigDecimal> scoreByAssignment = calculator.averageScoreByAssignment(bestScores);
		List<StudentProgress> lagging = new ArrayList<>();
		List<StudentProgress> unscored = new ArrayList<>();
		StudentCounts counts = addStudents(members, assignments.size(), completedByStudent,
				scoreByStudent, threshold, lagging, unscored);
		lagging.sort(Comparator.comparing(StudentProgress::averageScorePercent)
				.thenComparing(StudentProgress::studentId));
		return new ReportClassProgressResponse(
				classId,
				completionCalculator.completionPercentForClass(classId, completion),
				calculator.percent(BigDecimal.valueOf(counts.belowAverage()), BigDecimal.valueOf(counts.scored())),
				members.size(), counts.scored(), counts.belowAverage(),
				assignmentScores(assignments, scoreByAssignment), lagging, unscored);
	}

	private StudentCounts addStudents(
			List<ReportMemberRow> members,
			long totalAssignments,
			Map<Long, Long> completedByStudent,
			Map<Long, BigDecimal> scoreByStudent,
			BigDecimal threshold,
			List<StudentProgress> lagging,
			List<StudentProgress> unscored) {
		long scored = 0;
		long belowAverage = 0;
		for (ReportMemberRow member : members) {
			long completed = completedByStudent.getOrDefault(member.studentId(), 0L);
			BigDecimal average = scoreByStudent.get(member.studentId());
			StudentProgress student = studentProgress(member, completed, totalAssignments, average);
			if (average == null) {
				unscored.add(student);
			} else {
				scored++;
				if (average.compareTo(threshold) < 0) {
					belowAverage++;
					lagging.add(student);
				}
			}
		}
		return new StudentCounts(scored, belowAverage);
	}

	private StudentProgress studentProgress(
			ReportMemberRow member,
			long completed,
			long totalAssignments,
			BigDecimal average) {
		return new StudentProgress(
				member.studentId(), member.fullName(), completed, totalAssignments,
				calculator.percent(BigDecimal.valueOf(completed), BigDecimal.valueOf(totalAssignments)),
				average);
	}

	private List<AssignmentScore> assignmentScores(
			List<ReportAssignmentRow> assignments,
			Map<Long, BigDecimal> scoreByAssignment) {
		List<AssignmentScore> scores = new ArrayList<>();
		for (ReportAssignmentRow assignment : assignments) {
			scores.add(new AssignmentScore(assignment.assignmentId(), assignment.title(),
					scoreByAssignment.getOrDefault(assignment.assignmentId(), zero())));
		}
		return scores;
	}

	private Map<GradingStatus, Long> pendingByStatus(List<ReportPendingByStatus> rows) {
		Map<GradingStatus, Long> counts = new EnumMap<>(GradingStatus.class);
		for (GradingStatus status : PENDING_STATUSES) {
			counts.put(status, 0L);
		}
		for (ReportPendingByStatus row : rows) {
			counts.put(row.status(), row.gradingCount());
		}
		return counts;
	}

	private long sumPending(Map<GradingStatus, Long> pending) {
		long total = 0;
		for (Long count : pending.values()) {
			total += count;
		}
		return total;
	}

	private BigDecimal zero() {
		return BigDecimal.ZERO.setScale(2);
	}

	private java.time.OffsetDateTime utc(java.time.OffsetDateTime submittedAt) {
		return submittedAt == null ? null : submittedAt.withOffsetSameInstant(ZoneOffset.UTC);
	}

	private record StudentCounts(long scored, long belowAverage) {
	}
}
