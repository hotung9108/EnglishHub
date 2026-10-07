package com.english_hub.core.modules.auth.application.command;

public record ResetPasswordCommand(String email, String otp, String token, String newPassword) {
}
