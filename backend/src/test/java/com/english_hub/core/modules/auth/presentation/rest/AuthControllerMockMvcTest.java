package com.english_hub.core.modules.auth.presentation.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.common.email.EmailService;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.auth.application.command.LoginCommand;
import com.english_hub.core.modules.auth.application.service.AuthService;
import com.english_hub.core.modules.auth.domain.model.AuthUser;
import com.english_hub.core.modules.auth.domain.repository.AuthUserRepository;
import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.auth.domain.service.PasswordResetStore;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthUserResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.LoginRequest;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class AuthControllerMockMvcTest {

	private static final long USER_ID = 42L;
	private static final String EMAIL = "teacher@example.com";
	private static final String PASSWORD = "Secret01";
	private static final String PASSWORD_HASH = "encoded-password";
	private static final String ACCESS_TOKEN = "access-token";
	private static final long REFRESH_TOKEN_TTL_SECONDS = 604800L;
	private static final String RESET_PASSWORD_URL = "http://localhost:5173/reset-password";
	private static final String EMAIL_WHITESPACE_MESSAGE =
			"Email không được chứa khoảng trắng ở đầu hoặc cuối.";

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

	private static Stream<Arguments> loginEmailCases() {
		return Stream.of(
				Arguments.of("leading space", " " + EMAIL, false),
				Arguments.of("trailing space", EMAIL + " ", false),
				Arguments.of("leading TAB", "\t" + EMAIL, false),
				Arguments.of("trailing TAB", EMAIL + "\t", false),
				Arguments.of("leading NBSP", "\u00A0" + EMAIL, false),
				Arguments.of("trailing NBSP", EMAIL + "\u00A0", false),
				Arguments.of("leading narrow NBSP", "\u202F" + EMAIL, false),
				Arguments.of("trailing narrow NBSP", EMAIL + "\u202F", false),
				Arguments.of("unchanged email", EMAIL, true));
	}

	@Nested
	class RealServiceLoginValidation {

		@Mock
		private AuthUserRepository authUserRepository;
		@Mock
		private RefreshTokenRepository refreshTokenRepository;
		@Mock
		private PasswordEncoder passwordEncoder;
		@Mock
		private JwtTokenService jwtTokenService;
		@Mock
		private PasswordResetStore passwordResetStore;
		@Mock
		private EmailService emailService;

		private MockMvc realServiceMockMvc;
		private final JsonMapper jsonMapper = JsonMapper.builder().build();

		@BeforeEach
		void setUpRealService() {
			AuthService realService = new AuthService(
					authUserRepository,
					refreshTokenRepository,
					passwordEncoder,
					jwtTokenService,
					passwordResetStore,
					emailService,
					REFRESH_TOKEN_TTL_SECONDS,
					RESET_PASSWORD_URL);
			realServiceMockMvc = MockMvcBuilders.standaloneSetup(new AuthController(realService))
					.setControllerAdvice(new GlobalExceptionHandler())
					.build();
		}

		@ParameterizedTest(name = "{0}")
		@MethodSource("com.english_hub.core.modules.auth.presentation.rest.AuthControllerMockMvcTest#loginEmailCases")
		void validatesEmailBeforeAuthentication(String description, String email, boolean valid) throws Exception {
			if (valid) {
				AuthUser user = new AuthUser("Teacher", EMAIL, PASSWORD_HASH, UserRole.TEACHER, UserStatus.ACTIVE);
				user.setId(USER_ID);
				when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
				when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
				when(jwtTokenService.createAccessToken(eq(USER_ID), any(
						com.english_hub.core.modules.user.domain.model.UserRole.class))).thenReturn(ACCESS_TOKEN);
			}

			String body = jsonMapper.writeValueAsString(new LoginRequest(email, PASSWORD));
			ResultActions result = realServiceMockMvc.perform(post("/api/v1/auth/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
					.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

			if (valid) {
				result.andExpect(status().isOk())
						.andExpect(jsonPath("$.accessToken").value(ACCESS_TOKEN))
						.andExpect(jsonPath("$.refreshToken").isString())
						.andExpect(jsonPath("$.refreshToken").isNotEmpty());
				verify(authUserRepository).findByEmail(EMAIL);
				verify(refreshTokenRepository).create(eq(USER_ID), any(), any(), any(), any());
			} else {
				result.andExpect(status().isBadRequest())
						.andExpect(jsonPath("$.*", hasSize(1)))
						.andExpect(jsonPath("$.error").value(EMAIL_WHITESPACE_MESSAGE))
						.andExpect(jsonPath("$.accessToken").doesNotExist())
						.andExpect(jsonPath("$.refreshToken").doesNotExist());
				verifyNoInteractions(authUserRepository, passwordEncoder, jwtTokenService,
						refreshTokenRepository, passwordResetStore, emailService);
			}
		}
	}
}
