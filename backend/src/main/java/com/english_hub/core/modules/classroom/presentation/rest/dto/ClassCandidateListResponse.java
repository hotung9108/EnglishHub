package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.domain.model.ClassCandidateStudent;
import java.util.List;

public record ClassCandidateListResponse(List<ClassCandidateResponse> data) {

	public static ClassCandidateListResponse from(List<ClassCandidateStudent> candidates) {
		return new ClassCandidateListResponse(candidates.stream().map(ClassCandidateResponse::from).toList());
	}
}
