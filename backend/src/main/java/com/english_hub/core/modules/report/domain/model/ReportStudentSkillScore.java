package com.english_hub.core.modules.report.domain.model;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import java.math.BigDecimal;

public record ReportStudentSkillScore(
		Long submissionId,
		ModuleSkill skill,
		BigDecimal finalTotal,
		BigDecimal maxTotal) {
}
