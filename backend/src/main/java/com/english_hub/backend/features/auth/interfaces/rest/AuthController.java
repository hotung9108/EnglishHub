package com.english_hub.backend.features.auth.interfaces.rest;

import com.english_hub.backend.features.auth.application.command.LoginCommand;
import com.english_hub.backend.features.auth.application.command.RefreshCommand;
import com.english_hub.backend.features.auth.application.service.AuthService;
import com.english_hub.backend.features.auth.interfaces.rest.dto.AuthResponse;
import com.english_hub.backend.features.auth.interfaces.rest.dto.LoginRequest;
import com.english_hub.backend.features.auth.interfaces.rest.dto.RefreshRequest;
import com.english_hub.backend.features.auth.interfaces.rest.dto.RefreshResponse;
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
}