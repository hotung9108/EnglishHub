package com.english_hub.core.modules.auth.domain.service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

@Component
public class PasswordResetStore {

	public record ResetRecord(String email, String otp, String token, Instant expiresAt) {
		public boolean isExpired() {
			return Instant.now().isAfter(expiresAt);
		}
	}

	private final Map<String, ResetRecord> recordsByEmail = new ConcurrentHashMap<>();

	public void store(String email, String otp, String token, long ttlSeconds) {
		if (email == null) {
			return;
		}
		recordsByEmail.put(
				email.trim().toLowerCase(),
				new ResetRecord(email.trim().toLowerCase(), otp, token, Instant.now().plusSeconds(ttlSeconds)));
	}

	public boolean verifyAndConsume(String email, String otp, String token) {
		if (email == null) {
			return false;
		}
		String key = email.trim().toLowerCase();
		ResetRecord record = recordsByEmail.get(key);
		if (record == null || record.isExpired()) {
			recordsByEmail.remove(key);
			return false;
		}

		boolean otpMatches = otp != null && !otp.isBlank() && otp.trim().equals(record.otp());
		boolean tokenMatches = token != null && !token.isBlank() && token.trim().equals(record.token());

		if (otpMatches || tokenMatches) {
			recordsByEmail.remove(key);
			return true;
		}
		return false;
	}

	public void clear(String email) {
		if (email != null) {
			recordsByEmail.remove(email.trim().toLowerCase());
		}
	}
}
