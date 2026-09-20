package com.english_hub.core.infrastructure.persistence.entity;

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
@Table(name = "assignments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Assignment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "class_id", nullable = false)
	private Long classId;

	@Column(nullable = false, length = 200)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(name = "open_at", nullable = false)
	private OffsetDateTime openAt;

	@Column(name = "close_at", nullable = false)
	private OffsetDateTime closeAt;

	@Column(name = "max_submissions")
	private Integer maxSubmissions;

	@Column(name = "is_deleted", nullable = false)
	private boolean deleted;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "assignment_status")
	private AssignmentStatus status;

	public Assignment(
			Long classId,
			String title,
			String description,
			OffsetDateTime openAt,
			OffsetDateTime closeAt,
			Integer maxSubmissions,
			boolean deleted,
			AssignmentStatus status) {
		this.classId = classId;
		this.title = title;
		this.description = description;
		this.openAt = openAt;
		this.closeAt = closeAt;
		this.maxSubmissions = maxSubmissions;
		this.deleted = deleted;
		this.status = status;
	}
}
