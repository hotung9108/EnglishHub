package com.english_hub.core.modules.auth.presentation.rest;

import com.english_hub.core.modules.auth.application.command.ForgotPasswordCommand;
import com.english_hub.core.modules.auth.application.command.LoginCommand;
import com.english_hub.core.modules.auth.application.command.LogoutCommand;
import com.english_hub.core.modules.auth.application.command.RefreshCommand;
import com.english_hub.core.modules.auth.application.command.ResetPasswordCommand;
import com.english_hub.core.modules.auth.application.service.AuthService;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.ForgotPasswordRequest;
import com.english_hub.core.modules.auth.presentation.rest.dto.ForgotPasswordResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.LoginRequest;
import com.english_hub.core.modules.auth.presentation.rest.dto.LogoutRequest;
import com.english_hub.core.modules.auth.presentation.rest.dto.LogoutResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.RefreshRequest;
import com.english_hub.core.modules.auth.presentation.rest.dto.RefreshResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.ResetPasswordRequest;
import com.english_hub.core.modules.auth.presentation.rest.dto.ResetPasswordResponse;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
		AuthResponse response = authService.login(new LoginCommand(
				request == null ? null : request.email(),
				request == null ? null : request.password(),
				httpRequest.getHeader(HttpHeaders.USER_AGENT),
				httpRequest.getRemoteAddr()));
		return ResponseEntity.ok(response);
	}

	@PostMapping("/refresh")
	public ResponseEntity<RefreshResponse> refresh(@RequestBody RefreshRequest request) {
		RefreshResponse response = authService.refresh(new RefreshCommand(
				request == null ? null : request.refreshToken()));
		return ResponseEntity.ok(response);
	}

	@PostMapping("/logout")
	public ResponseEntity<LogoutResponse> logout(@RequestBody LogoutRequest request) {
		LogoutResponse response = authService.logout(new LogoutCommand(
				request == null ? null : request.refreshToken()));
		return ResponseEntity.ok(response);
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<ForgotPasswordResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
		ForgotPasswordResponse response = authService.forgotPassword(new ForgotPasswordCommand(
				request == null ? null : request.email()));
		return ResponseEntity.ok(response);
	}

	@PostMapping("/reset-password")
	public ResponseEntity<ResetPasswordResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
		ResetPasswordResponse response = authService.resetPassword(new ResetPasswordCommand(
				request == null ? null : request.email(),
				request == null ? null : request.otp(),
				request == null ? null : request.token(),
				request == null ? null : request.newPassword()));
		return ResponseEntity.ok(response);
	}
}