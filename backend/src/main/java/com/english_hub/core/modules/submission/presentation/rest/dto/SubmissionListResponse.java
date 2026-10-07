package com.english_hub.core.modules.submission.presentation.rest.dto;

import com.english_hub.core.modules.classroom.presentation.rest.dto.PaginationResponse;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionListResult;

import java.util.List;

public record SubmissionListResponse(
		List<SubmissionListItemResponse> data,
		PaginationResponse pagination) {

	public static SubmissionListResponse from(SubmissionListResult result) {
		return new SubmissionListResponse(
				result.data().stream().map(SubmissionListItemResponse::from).toList(),
				new PaginationResponse(result.page(), result.limit(), result.total()));
	}
}