package com.english_hub.core.modules.auth.presentation.rest.dto;

public record ResetPasswordRequest(String email, String otp, String token, String newPassword) {
}
