package com.english_hub.core.features.auth.interfaces.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.features.auth.application.command.LoginCommand;
import com.english_hub.core.features.auth.application.command.LogoutCommand;
import com.english_hub.core.features.auth.application.command.RefreshCommand;
import com.english_hub.core.features.auth.application.service.AuthService;
import com.english_hub.core.features.auth.interfaces.rest.dto.AuthResponse;
import com.english_hub.core.features.auth.interfaces.rest.dto.AuthUserResponse;
import com.english_hub.core.features.auth.interfaces.rest.dto.LoginRequest;
import com.english_hub.core.features.auth.interfaces.rest.dto.LogoutRequest;
import com.english_hub.core.features.auth.interfaces.rest.dto.LogoutResponse;
import com.english_hub.core.features.auth.interfaces.rest.dto.RefreshRequest;
import com.english_hub.core.features.auth.interfaces.rest.dto.RefreshResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

	@Mock
	private AuthService authService;

	@Mock
	private HttpServletRequest httpRequest;

	private AuthController authController;

	@BeforeEach
	void setUp() {
		authController = new AuthController(authService);
	}

	@Test
	void mapsLoginRequestAndMetadataIntoTheCommand() {
		AuthResponse expected = new AuthResponse(
				"Đăng nhập thành công.",
				"access-token",
				"refresh-token",
				new AuthUserResponse(42L, "Teacher", "teacher@example.com", "TEACHER"));
		when(httpRequest.getHeader("User-Agent")).thenReturn("MockAgent");
		when(httpRequest.getRemoteAddr()).thenReturn("10.0.0.1");
		when(authService.login(new LoginCommand("teacher@example.com", "Secret01", "MockAgent", "10.0.0.1")))
				.thenReturn(expected);

		ResponseEntity<AuthResponse> response = authController.login(
				new LoginRequest("teacher@example.com", "Secret01"),
				httpRequest);

		verify(authService).login(new LoginCommand("teacher@example.com", "Secret01", "MockAgent", "10.0.0.1"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(expected);
	}

	@Test
	void mapsRefreshRequestIntoTheCommand() {
		RefreshResponse expected = new RefreshResponse("Đã làm mới access token.", "new-access-token");
		when(authService.refresh(new RefreshCommand("raw-refresh-token"))).thenReturn(expected);

		ResponseEntity<RefreshResponse> response = authController.refresh(new RefreshRequest("raw-refresh-token"));

		verify(authService).refresh(new RefreshCommand("raw-refresh-token"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(expected);
	}

	@Test
	void mapsLogoutRequestIntoTheCommand() {
		LogoutResponse expected = new LogoutResponse("Đăng xuất thành công.");
		when(authService.logout(new LogoutCommand("raw-refresh-token"))).thenReturn(expected);

		ResponseEntity<LogoutResponse> response = authController.logout(new LogoutRequest("raw-refresh-token"));

		verify(authService).logout(new LogoutCommand("raw-refresh-token"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(expected);
	}
}