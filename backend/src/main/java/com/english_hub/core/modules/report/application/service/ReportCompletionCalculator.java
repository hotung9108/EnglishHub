package com.english_hub.core.modules.report.application.service;

import com.english_hub.core.modules.report.application.model.ReportCompletionRows;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentCompletionCount;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentCount;
import com.english_hub.core.modules.report.domain.model.ReportMemberCount;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ReportCompletionCalculator {
	private final ReportCalculator calculator;

	public ReportCompletionCalculator(ReportCalculator calculator) {
		this.calculator = calculator;
	}

	public BigDecimal completionPercent(List<Long> classIds, ReportCompletionRows rows) {
		Map<Long, Long> assignments = assignmentCounts(rows.assignments());
		Map<Long, Long> members = memberCounts(rows.members());
		long totalPairs = 0;
		for (Long classId : classIds) {
			totalPairs += assignments.getOrDefault(classId, 0L) * members.getOrDefault(classId, 0L);
		}
		long completedPairs = 0;
		for (ReportAssignmentCompletionCount row : rows.completed()) {
			completedPairs += row.completedStudentCount();
		}
		return calculator.percent(BigDecimal.valueOf(completedPairs), BigDecimal.valueOf(totalPairs));
	}

	public BigDecimal completionPercentForClass(long classId, ReportCompletionRows rows) {
		long total = countForClass(rows.assignments(), classId) * memberCountForClass(rows.members(), classId);
		long completed = 0;
		for (ReportAssignmentCompletionCount row : rows.completed()) {
			if (row.classId() == classId) {
				completed += row.completedStudentCount();
			}
		}
		return calculator.percent(BigDecimal.valueOf(completed), BigDecimal.valueOf(total));
	}

	public long sumAssignments(List<ReportAssignmentCount> rows) {
		long total = 0;
		for (ReportAssignmentCount row : rows) {
			total += row.assignmentCount();
		}
		return total;
	}

	public long countForClass(List<ReportAssignmentCount> rows, long classId) {
		for (ReportAssignmentCount row : rows) {
			if (row.classId() == classId) {
				return row.assignmentCount();
			}
		}
		return 0;
	}

	private long memberCountForClass(List<ReportMemberCount> rows, long classId) {
		for (ReportMemberCount row : rows) {
			if (row.classId() == classId) {
				return row.memberCount();
			}
		}
		return 0;
	}

	private Map<Long, Long> assignmentCounts(List<ReportAssignmentCount> rows) {
		Map<Long, Long> counts = new HashMap<>();
		for (ReportAssignmentCount row : rows) {
			counts.put(row.classId(), row.assignmentCount());
		}
		return counts;
	}

	private Map<Long, Long> memberCounts(List<ReportMemberCount> rows) {
		Map<Long, Long> counts = new HashMap<>();
		for (ReportMemberCount row : rows) {
			counts.put(row.classId(), row.memberCount());
		}
		return counts;
	}
}
