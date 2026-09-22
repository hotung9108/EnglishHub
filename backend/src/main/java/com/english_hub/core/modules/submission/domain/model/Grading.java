package com.english_hub.core.modules.submission.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Grading record attached to one submission-module. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Grading extends BaseEntity<Long> {

	private Long submissionModuleId;

	private GradingMethod method;

	private GradingStatus status;

	private BigDecimal finalScore;

	private BigDecimal maxScoreSnapshot;

	private String aiFeedback;

	private String finalFeedback;
}