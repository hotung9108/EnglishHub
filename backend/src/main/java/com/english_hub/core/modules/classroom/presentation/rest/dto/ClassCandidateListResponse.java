package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.domain.model.ClassCandidateStudent;
import java.util.List;

public record ClassCandidateListResponse(
		List<ClassCandidateResponse> data,
		PaginationResponse pagination) {

	public ClassCandidateListResponse(List<ClassCandidateResponse> data) {
		this(data, null);
	}

	public static ClassCandidateListResponse from(List<ClassCandidateStudent> candidates) {
		return new ClassCandidateListResponse(
				candidates.stream().map(ClassCandidateResponse::from).toList(),
				null);
	}

	public static ClassCandidateListResponse of(
			List<ClassCandidateStudent> candidates,
			int page,
			int limit,
			long total) {
		return new ClassCandidateListResponse(
				candidates.stream().map(ClassCandidateResponse::from).toList(),
				new PaginationResponse(page, limit, total));
	}
}
