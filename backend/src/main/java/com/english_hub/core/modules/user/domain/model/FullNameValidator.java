package com.english_hub.core.modules.user.domain.model;

import com.english_hub.core.common.ApiException;

import java.util.regex.Pattern;

public final class FullNameValidator {

	public static final int MIN_LENGTH = 2;
	public static final int MAX_LENGTH = 50;

	/**
	 * Matches valid full names:
	 * - Starts with a Unicode letter (\p{L})
	 * - Can contain spaces, hyphens (-), or apostrophes (') between words
	 * - Ends with a Unicode letter
	 * - Forbids digits (0-9) and special characters/symbols
	 */
	private static final Pattern FULL_NAME_PATTERN = Pattern.compile("^[\\p{L}]+(?:[ '-][\\p{L}]+)*$");
	private static final Pattern DIGIT_PATTERN = Pattern.compile(".*\\d.*");
	private static final Pattern SPECIAL_CHARS_PATTERN = Pattern.compile(".*[^\\p{L}\\s'-].*");

	private FullNameValidator() {
	}

	public static String validateAndNormalize(String fullName) {
		if (fullName == null || fullName.trim().isEmpty()) {
			throw ApiException.badRequest("Họ và tên không được để trống.");
		}

		String normalized = fullName.trim().replaceAll("\\s+", " ");

		if (normalized.length() < MIN_LENGTH) {
			throw ApiException.badRequest("Họ và tên phải có ít nhất " + MIN_LENGTH + " ký tự.");
		}

		if (normalized.length() > MAX_LENGTH) {
			throw ApiException.badRequest("Họ và tên không được vượt quá " + MAX_LENGTH + " ký tự.");
		}

		if (DIGIT_PATTERN.matcher(normalized).matches()) {
			throw ApiException.badRequest("Họ và tên không được chứa chữ số.");
		}

		if (SPECIAL_CHARS_PATTERN.matcher(normalized).matches()) {
			throw ApiException.badRequest("Họ và tên không được chứa ký tự đặc biệt.");
		}

		if (!FULL_NAME_PATTERN.matcher(normalized).matches()) {
			throw ApiException.badRequest("Họ và tên không đúng định dạng.");
		}

		return normalized;
	}

	public static boolean isValid(String fullName) {
		if (fullName == null || fullName.trim().isEmpty()) {
			return false;
		}
		String normalized = fullName.trim().replaceAll("\\s+", " ");
		if (normalized.length() < MIN_LENGTH || normalized.length() > MAX_LENGTH) {
			return false;
		}
		return FULL_NAME_PATTERN.matcher(normalized).matches();
	}
}
