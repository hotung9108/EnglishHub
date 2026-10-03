package com.english_hub.core.infrastructure.persistence.entity;

import com.fasterxml.jackson.databind.JsonNode;

import com.fasterxml.jackson.databind.node.ObjectNode;

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

	/*
	 * Hibernate 7.4.5's default JSON format mapper uses Jackson 2. Using
	 * tools.jackson.databind.JsonNode here fails during JSONB persistence, so
	 * this field intentionally uses the com.fasterxml.jackson.databind type.
	 */
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(columnDefinition = "jsonb")
	private JsonNode content;

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
		this.content = questionId == null
				? JsonbValueCodec.text(content)
				: JsonbValueCodec.parse(content, "content");
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

	public String getContent() {
		if (content == null) {
			return null;
		}
		return questionId == null && content.isTextual()
				? content.textValue()
				: JsonbValueCodec.serialize(content);
	}

	/**
	 * Merges the auto-grading verdict into the answer content so the per-question outcome travels
	 * with the answer itself, matching the {@code isCorrect}/{@code score} shape the submission
	 * chapter of the API design already documents.
	 *
	 * <p>Only valid for question-bound answers: essay and recording answers store {@code content} as
	 * a bare JSON string and have nothing to merge into.
	 */
	public void applyGradingOutcome(boolean isCorrect, BigDecimal score) {
		if (questionId == null) {
			throw new IllegalArgumentException("A grading outcome requires an answer bound to a question.");
		}
		if (!(content instanceof ObjectNode object)) {
			throw new IllegalArgumentException("A grading outcome requires an object answer content.");
		}
		object.put("isCorrect", isCorrect);
		object.put("score", score);
	}
}
