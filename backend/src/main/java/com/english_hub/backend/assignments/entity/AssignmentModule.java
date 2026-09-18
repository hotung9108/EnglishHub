package com.english_hub.backend.assignments.entity;

import java.math.BigDecimal;

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
@Table(name = "modules")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssignmentModule {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "assignment_id", nullable = false)
	private Long assignmentId;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "module_skill")
	private ModuleSkill skill;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "task_type", nullable = false, columnDefinition = "module_task_type")
	private ModuleTaskType taskType;

	@Column(name = "order_index", nullable = false)
	private int orderIndex;

	@Column(columnDefinition = "TEXT")
	private String instructions;

	@Column(name = "max_score", nullable = false, precision = 5, scale = 2)
	private BigDecimal maxScore;

	@Column(name = "source_audio_storage_key", length = 255)
	private String sourceAudioStorageKey;

	@Column(name = "source_audio_duration_seconds")
	private Integer sourceAudioDurationSeconds;

	@Column(name = "source_audio_mime_type", length = 50)
	private String sourceAudioMimeType;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "source_audio_upload_status", columnDefinition = "upload_status")
	private UploadStatus sourceAudioUploadStatus;

	@Column(name = "ai_instruction", columnDefinition = "TEXT")
	private String aiInstruction;

	public AssignmentModule(
			Long assignmentId,
			ModuleSkill skill,
			ModuleTaskType taskType,
			int orderIndex,
			String instructions,
			BigDecimal maxScore,
			String sourceAudioStorageKey,
			Integer sourceAudioDurationSeconds,
			String sourceAudioMimeType,
			UploadStatus sourceAudioUploadStatus,
			String aiInstruction) {
		this.assignmentId = assignmentId;
		this.skill = skill;
		this.taskType = taskType;
		this.orderIndex = orderIndex;
		this.instructions = instructions;
		this.maxScore = maxScore;
		this.sourceAudioStorageKey = sourceAudioStorageKey;
		this.sourceAudioDurationSeconds = sourceAudioDurationSeconds;
		this.sourceAudioMimeType = sourceAudioMimeType;
		this.sourceAudioUploadStatus = sourceAudioUploadStatus;
		this.aiInstruction = aiInstruction;
	}
}
