package com.english_hub.core.modules.classroom.presentation.rest.dto;

import com.english_hub.core.modules.classroom.domain.model.ClassCandidateStudent;

public record ClassCandidateResponse(
		Long id,
		String fullName,
		String email,
		String studentCode,
		String status) {

	public static ClassCandidateResponse from(ClassCandidateStudent student) {
		return new ClassCandidateResponse(
				student.id(),
				student.fullName(),
				student.email(),
				student.studentCode(),
				student.status());
	}
}
