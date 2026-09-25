package com.english_hub.core.modules.submission.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One submitted answer of a submission module, mirroring the shared {@code answers} row. */
@Getter
@Setter
@NoArgsConstructor
public class Answer extends BaseEntity<Long> {

	private Long submissionModuleId;

	private Long questionId;

	private String content;

	private String audioStorageKey;

	private String audioMimeType;

	private UploadStatus audioUploadStatus;

	private String docStorageKey;

	private String docMimeType;

	private UploadStatus docUploadStatus;

	public Answer(Long submissionModuleId, Long questionId, String content) {
		this(submissionModuleId, questionId, content, null, null, null, null, null, null);
	}

	public Answer(
			Long submissionModuleId,
			Long questionId,
			String content,
			String audioStorageKey,
			String audioMimeType,
			UploadStatus audioUploadStatus,
			String docStorageKey,
			String docMimeType,
			UploadStatus docUploadStatus) {
		this.submissionModuleId = submissionModuleId;
		this.questionId = questionId;
		this.content = content;
		this.audioStorageKey = audioStorageKey;
		this.audioMimeType = audioMimeType;
		this.audioUploadStatus = audioUploadStatus;
		this.docStorageKey = docStorageKey;
		this.docMimeType = docMimeType;
		this.docUploadStatus = docUploadStatus;
	}
}