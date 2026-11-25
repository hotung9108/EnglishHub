package com.english_hub.core.common.utils;

import com.english_hub.core.common.ApiException;
import java.nio.charset.StandardCharsets;

public final class PasswordLengthGuard {

	private static final int MAX_BCRYPT_PASSWORD_BYTES = 72;
	private static final String ERROR_MESSAGE = "Mật khẩu mới không được vượt quá 72 byte UTF-8.";

	private PasswordLengthGuard() {
	}

	public static void validate(String password) {
		if (password.getBytes(StandardCharsets.UTF_8).length > MAX_BCRYPT_PASSWORD_BYTES) {
			throw ApiException.badRequest(ERROR_MESSAGE);
		}
	}
}
