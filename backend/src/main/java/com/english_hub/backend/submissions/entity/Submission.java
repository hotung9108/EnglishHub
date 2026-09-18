package com.english_hub.backend.submissions.entity;

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

@Entity
@Table(name = "submissions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Submission {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "assignment_id", nullable = false)
	private Long assignmentId;

	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@Column(name = "attempt_number", nullable = false)
	private int attemptNumber;

	@Column(name = "submitted_at")
	private OffsetDateTime submittedAt;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "submission_status")
	private SubmissionStatus status;

	public Submission(
			Long assignmentId,
			Long studentId,
			int attemptNumber,
			OffsetDateTime submittedAt,
			SubmissionStatus status) {
		this.assignmentId = assignmentId;
		this.studentId = studentId;
		this.attemptNumber = attemptNumber;
		this.submittedAt = submittedAt;
		this.status = status;
	}
}
