package com.english_hub.core.modules.user.presentation.rest.dto;

public final class AdminResetPasswordResponse {

	private final String message;
	private final String newPassword;

	public AdminResetPasswordResponse(String message, String newPassword) {
		this.message = message;
		this.newPassword = newPassword;
	}

	public String getMessage() {
		return message;
	}

	public String getNewPassword() {
		return newPassword;
	}

	@Override
	public String toString() {
		return "AdminResetPasswordResponse[newPassword=<redacted>]";
	}
}
