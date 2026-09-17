package com.english_hub.backend.common.domain;

import java.util.Locale;

public enum UserRole {
	ADMIN,
	TEACHER,
	STUDENT;

	public static UserRole fromApiValue(String value) {
		if (value == null) {
			throw new IllegalArgumentException("role is required");
		}
		try {
			return UserRole.valueOf(value.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("unsupported role");
		}
	}

	public static UserRole fromTokenValue(String value) {
		return UserRole.valueOf(value);
	}
}