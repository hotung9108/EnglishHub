package com.english_hub.core.modules.assignment.domain.model;

import java.util.Locale;

public enum AssignmentStatus {
	DRAFT,
	PUBLISHED,
	CLOSED;

	public static AssignmentStatus fromApiValue(String value) {
		if (value == null) {
			throw new IllegalArgumentException("status is required");
		}
		try {
			return valueOf(value.trim().toUpperCase(Locale.ROOT));
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("unsupported status", exception);
		}
	}
}
