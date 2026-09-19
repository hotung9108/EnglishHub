package com.english_hub.backend.infrastructure.persistence.jpa_impl.entity;

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

@Entity
@Table(name = "answer_annotations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AnswerAnnotation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "answer_id", nullable = false)
	private Long answerId;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "annotation_source")
	private AnnotationSource source;

	@Column(name = "start_offset", nullable = false)
	private int startOffset;

	@Column(name = "end_offset", nullable = false)
	private int endOffset;

	@Column(name = "error_type", length = 50)
	private String errorType;

	@Column(columnDefinition = "TEXT")
	private String comment;

	@Column(name = "suggested_fix", columnDefinition = "TEXT")
	private String suggestedFix;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "review_status", nullable = false, columnDefinition = "review_status")
	private ReviewStatus reviewStatus;

	public AnswerAnnotation(
			Long answerId,
			AnnotationSource source,
			int startOffset,
			int endOffset,
			String errorType,
			String comment,
			String suggestedFix,
			ReviewStatus reviewStatus) {
		this.answerId = answerId;
		this.source = source;
		this.startOffset = startOffset;
		this.endOffset = endOffset;
		this.errorType = errorType;
		this.comment = comment;
		this.suggestedFix = suggestedFix;
		this.reviewStatus = reviewStatus;
	}
}
