package com.english_hub.core.infrastructure.email;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.email.EmailService;
import org.springframework.http.HttpStatus;

/**
 * Fallback bean used when no email provider is configured. Keeps the application
 * bootable without credentials and reports a clear error the first time a mail is
 * attempted, instead of silently dropping it.
 */
public class UnavailableEmailService implements EmailService {

	private static final String NOT_CONFIGURED_MESSAGE = "Dịch vụ email chưa được cấu hình.";

	@Override
	public void sendPasswordResetOtp(String toEmail, String otp, String resetUrl, int ttlMinutes) {
		throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, NOT_CONFIGURED_MESSAGE);
	}
}
