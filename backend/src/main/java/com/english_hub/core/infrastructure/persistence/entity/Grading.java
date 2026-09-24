package com.english_hub.core.infrastructure.persistence.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "gradings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Grading {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "submission_module_id", nullable = false)
	private Long submissionModuleId;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "grading_method")
	private GradingMethod method;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "grading_status")
	private GradingStatus status;

	@Column(name = "ai_feedback", columnDefinition = "TEXT")
	private String aiFeedback;

	@Column(name = "final_score", precision = 5, scale = 2)
	private BigDecimal finalScore;

	@Column(name = "final_feedback", columnDefinition = "TEXT")
	private String finalFeedback;

	@Column(name = "max_score_snapshot", precision = 5, scale = 2)
	private BigDecimal maxScoreSnapshot;

	@Column(name = "reviewed_by")
	private Long reviewedBy;

	@Column(name = "reviewed_at")
	private OffsetDateTime reviewedAt;

	@Column(name = "graded_at")
	private OffsetDateTime gradedAt;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "ai_transcript", columnDefinition = "jsonb")
	private JsonNode aiTranscript;

	@Column(name = "ai_instruction_snapshot", columnDefinition = "TEXT")
	private String aiInstructionSnapshot;

	public Grading(
			Long submissionModuleId,
			GradingMethod method,
			GradingStatus status,
			String aiFeedback,
			BigDecimal finalScore,
			String finalFeedback,
			BigDecimal maxScoreSnapshot,
			Long reviewedBy,
			OffsetDateTime reviewedAt,
			OffsetDateTime gradedAt,
			JsonNode aiTranscript,
			String aiInstructionSnapshot) {
		this.submissionModuleId = submissionModuleId;
		this.method = method;
		this.status = status;
		this.aiFeedback = aiFeedback;
		this.finalScore = finalScore;
		this.finalFeedback = finalFeedback;
		this.maxScoreSnapshot = maxScoreSnapshot;
		this.reviewedBy = reviewedBy;
		this.reviewedAt = reviewedAt;
		this.gradedAt = gradedAt;
		this.aiTranscript = aiTranscript;
		this.aiInstructionSnapshot = aiInstructionSnapshot;
	}

	public void updateTeacherGrade(
			BigDecimal finalScore,
			String finalFeedback,
			Long reviewedBy,
			OffsetDateTime reviewedAt) {
		this.method = GradingMethod.TEACHER_MANUAL;
		this.status = GradingStatus.COMPLETED;
		this.finalScore = finalScore;
		this.finalFeedback = finalFeedback;
		this.reviewedBy = reviewedBy;
		this.reviewedAt = reviewedAt;
		this.gradedAt = reviewedAt;
	}
}
