package com.english_hub.core.modules.report.application.service;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ReportCalculator {
	private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
	private static final MathContext SCORE_CONTEXT = MathContext.DECIMAL128;

	public List<ReportSubmissionScore> pickBestAttempts(List<ReportSubmissionScore> rows) {
		Map<StudentAssignment, ReportSubmissionScore> best = new HashMap<>();
		for (ReportSubmissionScore row : rows) {
			if (!isFullyScored(row)) {
				continue;
			}
			StudentAssignment key = new StudentAssignment(row.studentId(), row.assignmentId());
			ReportSubmissionScore previous = best.get(key);
			if (previous == null || isBetterAttempt(row, previous)) {
				best.put(key, row);
			}
		}
		return new ArrayList<>(best.values());
	}

	public BigDecimal averageScorePercent(List<ReportSubmissionScore> rows) {
		if (rows.isEmpty()) {
			return BigDecimal.ZERO.setScale(2);
		}
		BigDecimal totalRatio = BigDecimal.ZERO;
		for (ReportSubmissionScore row : rows) {
			totalRatio = totalRatio.add(scoreRatio(row), SCORE_CONTEXT);
		}
		return totalRatio.divide(BigDecimal.valueOf(rows.size()), SCORE_CONTEXT)
				.multiply(HUNDRED)
				.setScale(2, RoundingMode.HALF_UP);
	}

	public Map<ModuleSkill, BigDecimal> averageSkillScorePercent(
			List<ReportStudentSkillScore> rows, List<ReportSubmissionScore> bestAttempts) {
		Set<Long> selectedSubmissions = new HashSet<>();
		for (ReportSubmissionScore attempt : bestAttempts) {
			selectedSubmissions.add(attempt.submissionId());
		}
		Map<ModuleSkill, List<BigDecimal>> ratiosBySkill = new EnumMap<>(ModuleSkill.class);
		for (ReportStudentSkillScore row : rows) {
			if (selectedSubmissions.contains(row.submissionId())) {
				ratiosBySkill.computeIfAbsent(row.skill(), ignored -> new ArrayList<>())
						.add(skillRatio(row));
			}
		}
		Map<ModuleSkill, BigDecimal> averages = new EnumMap<>(ModuleSkill.class);
		for (Map.Entry<ModuleSkill, List<BigDecimal>> entry : ratiosBySkill.entrySet()) {
			BigDecimal total = BigDecimal.ZERO;
			for (BigDecimal ratio : entry.getValue()) {
				total = total.add(ratio, SCORE_CONTEXT);
			}
			averages.put(entry.getKey(), total.divide(BigDecimal.valueOf(entry.getValue().size()), SCORE_CONTEXT)
					.multiply(HUNDRED).setScale(2, RoundingMode.HALF_UP));
		}
		return averages;
	}

	public Map<Long, BigDecimal> averageScoreByStudent(List<ReportSubmissionScore> rows) {
		Map<Long, List<ReportSubmissionScore>> groups = new HashMap<>();
		for (ReportSubmissionScore row : rows) {
			groups.computeIfAbsent(row.studentId(), ignored -> new ArrayList<>()).add(row);
		}
		return averageGroups(groups);
	}

	public Map<Long, BigDecimal> averageScoreByClass(List<ReportSubmissionScore> rows) {
		Map<Long, List<ReportSubmissionScore>> groups = new HashMap<>();
		for (ReportSubmissionScore row : rows) {
			groups.computeIfAbsent(row.classId(), ignored -> new ArrayList<>()).add(row);
		}
		return averageGroups(groups);
	}

	public Map<Long, BigDecimal> averageScoreByAssignment(List<ReportSubmissionScore> rows) {
		Map<Long, List<ReportSubmissionScore>> groups = new HashMap<>();
		for (ReportSubmissionScore row : rows) {
			groups.computeIfAbsent(row.assignmentId(), ignored -> new ArrayList<>()).add(row);
		}
		return averageGroups(groups);
	}

	public BigDecimal percent(BigDecimal numerator, BigDecimal denominator) {
		if (denominator == null || denominator.signum() == 0) {
			return BigDecimal.ZERO.setScale(2);
		}
		return numerator.multiply(HUNDRED)
				.divide(denominator, 2, RoundingMode.HALF_UP);
	}

	private Map<Long, BigDecimal> averageGroups(Map<Long, List<ReportSubmissionScore>> groups) {
		Map<Long, BigDecimal> averages = new HashMap<>();
		for (Map.Entry<Long, List<ReportSubmissionScore>> entry : groups.entrySet()) {
			averages.put(entry.getKey(), averageScorePercent(entry.getValue()));
		}
		return averages;
	}

	private boolean isFullyScored(ReportSubmissionScore row) {
		return row.moduleCount() != null
				&& row.moduleCount() > 0
				&& row.moduleCount().equals(row.completedModuleCount())
				&& row.finalTotal() != null
				&& row.maxTotal() != null;
	}

	private boolean isBetterAttempt(ReportSubmissionScore candidate, ReportSubmissionScore current) {
		int scoreOrder = compareScore(candidate, current);
		if (scoreOrder != 0) {
			return scoreOrder > 0;
		}
		int timeOrder = compareSubmittedAt(candidate.submittedAt(), current.submittedAt());
		return timeOrder != 0 ? timeOrder > 0 : candidate.submissionId() > current.submissionId();
	}

	private int compareScore(ReportSubmissionScore first, ReportSubmissionScore second) {
		boolean firstHasMaximum = first.maxTotal().signum() > 0;
		boolean secondHasMaximum = second.maxTotal().signum() > 0;
		if (firstHasMaximum != secondHasMaximum) {
			return firstHasMaximum ? 1 : -1;
		}
		if (!firstHasMaximum) {
			return 0;
		}
		return first.finalTotal().multiply(second.maxTotal())
				.compareTo(second.finalTotal().multiply(first.maxTotal()));
	}

	private int compareSubmittedAt(OffsetDateTime first, OffsetDateTime second) {
		if (first == null || second == null) {
			return first == second ? 0 : first == null ? -1 : 1;
		}
		return first.toInstant().compareTo(second.toInstant());
	}

	private BigDecimal scoreRatio(ReportSubmissionScore row) {
		if (row.maxTotal() == null || row.maxTotal().signum() == 0) {
			return BigDecimal.ZERO;
		}
		return row.finalTotal().divide(row.maxTotal(), SCORE_CONTEXT);
	}

	private BigDecimal skillRatio(ReportStudentSkillScore row) {
		if (row.maxTotal() == null || row.maxTotal().signum() == 0) {
			return BigDecimal.ZERO;
		}
		return row.finalTotal().divide(row.maxTotal(), SCORE_CONTEXT);
	}

	private record StudentAssignment(Long studentId, Long assignmentId) {
	}
}
