package com.english_hub.core.modules.report.application.model;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import java.math.BigDecimal;
import java.util.List;

public record StudentOverallScoreResponse(
		BigDecimal overallScore,
		boolean limitedData,
		int completedSkillCount,
		List<ModuleSkill> missingSkills) {
}
