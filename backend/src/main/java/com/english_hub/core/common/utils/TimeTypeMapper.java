package com.english_hub.core.common.utils;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class TimeTypeMapper {

	public static Instant toInstant(OffsetDateTime value) {
		return value == null ? null : value.toInstant();
	}

	public static OffsetDateTime toOffsetDateTime(Instant value) {
		return value == null ? null : OffsetDateTime.ofInstant(value, ZoneOffset.UTC);
	}
}
