package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerResult;

import tools.jackson.databind.JsonNode;

public record AnswerDetailResponse(
		Long id,
		Long questionId,
		JsonNode content,
		String docStorageKey,
		String docMimeType,
		String docUploadStatus,
		String audioStorageKey,
		String audioMimeType,
		String audioUploadStatus) {

	public static AnswerDetailResponse from(AnswerResult result) {
		return new AnswerDetailResponse(
				result.id(),
				result.questionId(),
				result.content(),
				result.docStorageKey(),
				result.docMimeType(),
				result.docUploadStatus() == null ? null : result.docUploadStatus().name(),
				result.audioStorageKey(),
				result.audioMimeType(),
				result.audioUploadStatus() == null ? null : result.audioUploadStatus().name());
	}
}