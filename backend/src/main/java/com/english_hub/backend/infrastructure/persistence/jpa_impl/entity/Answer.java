package com.english_hub.backend.infrastructure.persistence.jpa_impl.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.UploadStatus;
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
@Table(name = "answers")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Answer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "submission_module_id", nullable = false)
	private Long submissionModuleId;

	@Column(name = "question_id")
	private Long questionId;

	@Column(columnDefinition = "TEXT")
	private String content;

	@Column(name = "audio_storage_key", length = 255)
	private String audioStorageKey;

	@Column(name = "audio_duration_seconds")
	private Integer audioDurationSeconds;

	@Column(name = "audio_file_size_bytes")
	private Long audioFileSizeBytes;

	@Column(name = "audio_mime_type", length = 50)
	private String audioMimeType;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "audio_upload_status", columnDefinition = "upload_status")
	private UploadStatus audioUploadStatus;

	@Column(name = "doc_storage_key", length = 255)
	private String docStorageKey;

	@Column(name = "doc_mime_type", length = 50)
	private String docMimeType;

	@Column(name = "doc_file_size_bytes")
	private Long docFileSizeBytes;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "doc_upload_status", columnDefinition = "upload_status")
	private UploadStatus docUploadStatus;

	public Answer(
			Long submissionModuleId,
			Long questionId,
			String content,
			String audioStorageKey,
			Integer audioDurationSeconds,
			Long audioFileSizeBytes,
			String audioMimeType,
			UploadStatus audioUploadStatus,
			String docStorageKey,
			String docMimeType,
			Long docFileSizeBytes,
			UploadStatus docUploadStatus) {
		this.submissionModuleId = submissionModuleId;
		this.questionId = questionId;
		this.content = content;
		this.audioStorageKey = audioStorageKey;
		this.audioDurationSeconds = audioDurationSeconds;
		this.audioFileSizeBytes = audioFileSizeBytes;
		this.audioMimeType = audioMimeType;
		this.audioUploadStatus = audioUploadStatus;
		this.docStorageKey = docStorageKey;
		this.docMimeType = docMimeType;
		this.docFileSizeBytes = docFileSizeBytes;
		this.docUploadStatus = docUploadStatus;
	}
}
