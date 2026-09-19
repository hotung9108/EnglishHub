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
@Table(name = "submission_modules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SubmissionModule {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "submission_id", nullable = false)
	private Long submissionId;

	@Column(name = "module_id", nullable = false)
	private Long moduleId;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "submission_status")
	private SubmissionStatus status;

	public SubmissionModule(
			Long submissionId,
			Long moduleId,
			SubmissionStatus status) {
		this.submissionId = submissionId;
		this.moduleId = moduleId;
		this.status = status;
	}
}
