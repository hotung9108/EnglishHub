package com.english_hub.backend.features.user.domain.model;

import java.time.LocalDate;

public record User(
		Long id,
		String fullName,
		String email,
		String phone,
		String avatarUrl,
		String passwordHash,
		UserRole role,
		UserStatus status,
		boolean deleted,
		String specialization,
		String studentCode,
		LocalDate dateOfBirth,
		String parentPhone) {

	public boolean isActive() {
		return !deleted && status == UserStatus.ACTIVE;
	}

	public boolean isAdmin() {
		return role == UserRole.ADMIN;
	}
}
