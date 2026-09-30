package com.english_hub.core.modules.report.application.model;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ReportStudentProgressResponse(
		Long studentId,
		String studentName,
		Long classId,
		List<SkillAverage> skillAverages,
		List<ScoreTimeline> scoreTimeline) {

	public record SkillAverage(ModuleSkill skill, BigDecimal averageScorePercent) {
	}

	public record ScoreTimeline(
			Long assignmentId,
			String title,
			OffsetDateTime submittedAt,
			BigDecimal scorePercent) {
	}
}
