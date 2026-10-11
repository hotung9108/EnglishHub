package com.english_hub.core.modules.auth.presentation.rest;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.modules.auth.application.command.LoginCommand;
import com.english_hub.core.modules.auth.application.service.AuthService;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthUserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AuthControllerMockMvcTest {

	@Mock
	private AuthService authService;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	@Test
	void unsupportedContentTypeReturns415InsteadOf500() throws Exception {
		mockMvc.perform(post("/api/v1/auth/login")
					.contentType(MediaType.TEXT_PLAIN)
					.content("{\"email\":\"teacher@example.com\",\"password\":\"Secret01\"}"))
				.andExpect(status().isUnsupportedMediaType())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void missingContentTypeReturns415InsteadOf500() throws Exception {
		mockMvc.perform(post("/api/v1/auth/login")
					.content("{\"email\":\"teacher@example.com\",\"password\":\"Secret01\"}"))
				.andExpect(status().isUnsupportedMediaType())
				.andExpect(jsonPath("$.error").exists());
	}

	@Test
	void validJsonRequestStillSucceeds() throws Exception {
		when(authService.login(any(LoginCommand.class))).thenReturn(new AuthResponse(
				"Đăng nhập thành công.",
				"access-token",
				"refresh-token",
				new AuthUserResponse(42L, "Teacher", "teacher@example.com", "TEACHER")));

		mockMvc.perform(post("/api/v1/auth/login")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"email\":\"teacher@example.com\",\"password\":\"Secret01\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").value("access-token"));
	}
}
