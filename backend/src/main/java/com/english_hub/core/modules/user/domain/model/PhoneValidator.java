package com.english_hub.core.modules.user.domain.model;

import com.english_hub.core.common.ApiException;
import java.util.regex.Pattern;

public final class PhoneValidator {

	public static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{9,15}$");
	public static final int MAX_LENGTH = 20;

	private PhoneValidator() {
	}

	public static String validateAndNormalize(String phone) {
		if (phone == null) {
			return null;
		}
		String normalized = phone.trim();
		if (normalized.isEmpty()) {
			return null;
		}
		if (normalized.length() > MAX_LENGTH) {
			throw ApiException.badRequest("Số điện thoại không được vượt quá " + MAX_LENGTH + " ký tự.");
		}
		if (!PHONE_PATTERN.matcher(normalized).matches()) {
			throw ApiException.badRequest("Số điện thoại không đúng định dạng.");
		}
		return normalized;
	}
}
