package com.english_hub.backend.common.domain;

import java.util.Locale;

public enum UserStatus {
	ACTIVE,
	LOCKED;

	public static UserStatus fromApiValue(String value) {
		if (value == null) {
			throw new IllegalArgumentException("status is required");
		}
		try {
			return UserStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("unsupported status");
		}
	}
}