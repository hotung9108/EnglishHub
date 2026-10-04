package com.english_hub.core.modules.grading.domain.model;

import java.math.BigDecimal;
import java.util.List;

/** Outcome of scoring one submission module: a verdict per question plus the module total. */
public record AutoGradeResult(List<AnswerOutcome> outcomes, BigDecimal totalScore) {
}