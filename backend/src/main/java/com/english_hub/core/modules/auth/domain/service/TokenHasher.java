package com.english_hub.core.modules.auth.domain.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Utility responsible for hashing opaque refresh tokens before persistence.
 */
public final class TokenHasher {

	private static final int HEX_RADIX = 16;

	private TokenHasher() {
	}

	public static String sha256(String value) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			StringBuilder hex = new StringBuilder(hash.length * 2);
			for (byte b : hash) {
				hex.append(Character.forDigit((b >> 4) & 0xF, HEX_RADIX));
				hex.append(Character.forDigit(b & 0xF, HEX_RADIX));
			}
			return hex.toString();
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("SHA-256 message digest is not available", exception);
		}
	}
}