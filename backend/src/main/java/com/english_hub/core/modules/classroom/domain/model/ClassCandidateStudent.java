package com.english_hub.core.modules.classroom.domain.model;

/** An eligible student candidate to be enrolled into a class. */
public record ClassCandidateStudent(
		Long id,
		String fullName,
		String email,
		String studentCode,
		String status) {
}
