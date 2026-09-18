package com.english_hub.backend.gradings.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "grading_change_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GradingChangeLog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "grading_id", nullable = false)
	private Long gradingId;

	@Column(name = "changed_by", nullable = false)
	private Long changedBy;

	@Column(name = "old_score", precision = 5, scale = 2)
	private BigDecimal oldScore;

	@Column(name = "new_score", precision = 5, scale = 2)
	private BigDecimal newScore;

	@Column(columnDefinition = "TEXT")
	private String note;

	@Column(name = "changed_at", nullable = false)
	private OffsetDateTime changedAt;

	public GradingChangeLog(
			Long gradingId,
			Long changedBy,
			BigDecimal oldScore,
			BigDecimal newScore,
			String note,
			OffsetDateTime changedAt) {
		this.gradingId = gradingId;
		this.changedBy = changedBy;
		this.oldScore = oldScore;
		this.newScore = newScore;
		this.note = note;
		this.changedAt = changedAt;
	}
}
