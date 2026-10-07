package com.english_hub.core.modules.auth.presentation.rest.dto;

public record ForgotPasswordResponse(String message, String email, String debugOtp) {
}
