package com.english_hub.core.common.email;

/**
 * Provider-agnostic outbound email port.
 *
 * <p>Business code depends on this contract only; the concrete provider
 * (currently EmailJS) lives in the infrastructure layer. Swapping providers
 * therefore means adding a new implementation, not touching callers.</p>
 */
public interface EmailService {

	/**
	 * Sends the password-reset one-time code (and the deep link that carries the
	 * reset token) to the recipient.
	 *
	 * @param toEmail    recipient address
	 * @param otp        the six-digit one-time code the user must enter
	 * @param resetUrl   deep link embedding the reset token
	 * @param ttlMinutes how long the code stays valid, in minutes
	 */
	void sendPasswordResetOtp(String toEmail, String otp, String resetUrl, int ttlMinutes);
}
