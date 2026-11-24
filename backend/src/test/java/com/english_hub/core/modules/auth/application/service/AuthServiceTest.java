package com.english_hub.core.modules.auth.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.common.email.EmailService;
import com.english_hub.core.modules.auth.application.command.LoginCommand;
import com.english_hub.core.modules.auth.application.command.ForgotPasswordCommand;
import com.english_hub.core.modules.auth.application.command.LogoutCommand;
import com.english_hub.core.modules.auth.application.command.RefreshCommand;
import com.english_hub.core.modules.auth.application.command.ResetPasswordCommand;
import com.english_hub.core.modules.auth.domain.model.AuthUser;
import com.english_hub.core.modules.auth.domain.model.RefreshToken;
import com.english_hub.core.modules.auth.domain.repository.AuthUserRepository;
import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.auth.domain.service.TokenHasher;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthUserResponse;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import java.time.Instant;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	private static final long USER_ID = 42L;
	private static final String EMAIL = "teacher@example.com";
	private static final String PASSWORD = "Secret01";

	private static final String RAW_REFRESH_TOKEN = "raw-refresh-token";
	private static final String MISSING_CREDENTIALS_MESSAGE = "Vui lòng nhập email và mật khẩu.";
	private static final String EMAIL_WHITESPACE_MESSAGE =
			"Email không được chứa khoảng trắng ở đầu hoặc cuối.";

	@Mock
	private AuthUserRepository authUserRepository;

	@Mock
	private RefreshTokenRepository refreshTokenRepository;

	@Mock
	private JwtTokenService jwtTokenService;

	@Mock
	private EmailService emailService;

	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
	private final com.english_hub.core.modules.auth.domain.service.PasswordResetStore passwordResetStore =
			new com.english_hub.core.modules.auth.domain.service.PasswordResetStore();
	private AuthService authService;

	@BeforeEach
	void setUp() {
		authService = new AuthService(
				authUserRepository,
				refreshTokenRepository,
				passwordEncoder,
				jwtTokenService,
				passwordResetStore,
				emailService,
				604800L,
				"http://localhost:5173/reset-password");
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("missingLoginCredentials")
	void rejectsMissingCredentials(String description, LoginCommand command) {
		assertLoginRejectedBeforeLookup(command, MISSING_CREDENTIALS_MESSAGE);
	}

	private static Stream<Arguments> missingLoginCredentials() {
		return Stream.of(
				Arguments.of("null command", null),
				Arguments.of("null email", credentials(null, PASSWORD)),
				Arguments.of("empty email", credentials("", PASSWORD)),
				Arguments.of("ASCII whitespace email", credentials(" \t\r\n\u000B\f ", PASSWORD)),
				Arguments.of("Unicode whitespace email", credentials("\u0085\u00A0\u2003\u202F\u2028", PASSWORD)),
				Arguments.of("mixed whitespace email", credentials(" \t\u00A0\r\u2003\n\u202F", PASSWORD)),
				Arguments.of("null password", credentials(EMAIL, null)),
				Arguments.of("empty password", credentials(EMAIL, "")),
				Arguments.of("blank password", credentials(EMAIL, " \t\r\n")),
				Arguments.of("both credentials missing", credentials(null, null)),
				Arguments.of("boundary whitespace and null password", credentials(" " + EMAIL, null)),
				Arguments.of("boundary whitespace and empty password", credentials(EMAIL + "\u00A0", "")),
				Arguments.of("boundary whitespace and blank password", credentials("\u202F" + EMAIL, " ")));
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("loginWhitespaceCharacters")
	void rejectsBoundaryWhitespaceBeforeAnyAuthentication(String description, String whitespace) {
		assertAll(
				() -> assertBoundaryEmailRejected(whitespace + EMAIL),
				() -> assertBoundaryEmailRejected(EMAIL + whitespace),
				() -> assertBoundaryEmailRejected(whitespace + EMAIL + whitespace),
				() -> assertBoundaryEmailRejected(whitespace.repeat(3) + EMAIL + whitespace.repeat(2)),
				() -> assertBoundaryEmailRejected("\t" + whitespace + EMAIL + "\u00A0\r\n"));
	}

	private static Stream<Arguments> loginWhitespaceCharacters() {
		return Stream.of(
				Arguments.of("space", " "),
				Arguments.of("TAB", "\t"),
				Arguments.of("LF", "\n"),
				Arguments.of("CR", "\r"),
				Arguments.of("VT", "\u000B"),
				Arguments.of("FF", "\f"),
				Arguments.of("NEL", "\u0085"),
				Arguments.of("NBSP", "\u00A0"),
				Arguments.of("em space", "\u2003"),
				Arguments.of("narrow NBSP", "\u202F"),
				Arguments.of("line separator", "\u2028"));
	}

	@ParameterizedTest
	@ValueSource(strings = {"unknown account", "wrong password", "locked account"})
	void boundaryWhitespaceTakesPriorityOverAccountAndPasswordChecks(String scenario) {
		AuthUser user = activeTeacher(PASSWORD);
		if (scenario.equals("locked account")) {
			user.setStatus(UserStatus.LOCKED);
		}
		Optional<AuthUser> lookupResult = scenario.equals("unknown account") ? Optional.empty() : Optional.of(user);
		lenient().when(authUserRepository.findByEmail(any())).thenReturn(lookupResult);
		String password = scenario.equals("wrong password") ? "WrongPass99" : PASSWORD;

		assertLoginRejectedBeforeLookup(credentials(" " + EMAIL + " ", password), EMAIL_WHITESPACE_MESSAGE);
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"teacher @example.com",
			"\u200Bteacher@example.com", "teacher@example.com\u200B", "\u200Bteacher@example.com\u200B",
			"\uFEFFteacher@example.com", "teacher@example.com\uFEFF", "\uFEFFteacher@example.com\uFEFF",
			"Teacher@example.com", "teacher@EXAMPLE.COM", "TEACHER@EXAMPLE.COM"
	})
	void passesEmailOutsideBoundaryWhitespaceRuleToLookupUnchanged(String email) {
		when(authUserRepository.findByEmail(email)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.login(credentials(email, PASSWORD)))
				.isInstanceOfSatisfying(ApiException.class, exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
					assertThat(exception.getMessage()).isEqualTo("Tài khoản không tồn tại.");
				});
		verify(authUserRepository).findByEmail(email);
		assertNoAuthenticationSideEffects();
	}

	@ParameterizedTest
	@ValueSource(strings = {" " + PASSWORD, PASSWORD + " ", " " + PASSWORD + " "})
	void authenticatesUsingTheOriginalPasswordIncludingBoundarySpaces(String password) {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeTeacher(password)));

		AuthResponse response = authService.login(credentials(EMAIL, password));

		assertThat(response.user().id()).isEqualTo(USER_ID);
		assertThat(response.refreshToken()).isNotBlank();
		verify(authUserRepository).findByEmail(EMAIL);
		verify(refreshTokenRepository).create(eq(USER_ID), any(), any(), any(), any());
	}

	private static LoginCommand credentials(String email, String password) {
		return new LoginCommand(email, password, null, null);
	}

	private void assertBoundaryEmailRejected(String email) {
		assertLoginRejectedBeforeLookup(credentials(email, PASSWORD), EMAIL_WHITESPACE_MESSAGE);
	}

	private void assertLoginRejectedBeforeLookup(LoginCommand command, String message) {
		assertThatThrownBy(() -> authService.login(command))
				.isInstanceOfSatisfying(ApiException.class, exception -> {
					assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
					assertThat(exception.getMessage()).isEqualTo(message);
				});
		verifyNoInteractions(authUserRepository, jwtTokenService, refreshTokenRepository, emailService);
	}

	@Test
	void returnsNotFoundForUnknownEmail() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.login(loginCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.NOT_FOUND));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void rejectsWrongPassword() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeTeacher("WrongPass99")));

		assertThatThrownBy(() -> authService.login(loginCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void rejectsLockedAccount() {
		AuthUser locked = activeTeacher(PASSWORD);
		locked.setStatus(UserStatus.LOCKED);
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(locked));

		assertThatThrownBy(() -> authService.login(loginCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.FORBIDDEN));
		assertNoAuthenticationSideEffects();
	}

	@ParameterizedTest
	@EnumSource(UserRole.class)
	void loginSucceedsAndPersistsTheHashedRefreshToken(UserRole role) {
		AuthUser user = activeTeacher(PASSWORD);
		user.setRole(role);
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
		when(jwtTokenService.createAccessToken(eq(USER_ID), any(
				com.english_hub.core.modules.user.domain.model.UserRole.class))).thenReturn("access-token");

		AuthResponse response = authService.login(loginCommand());

		assertThat(response.message()).isEqualTo("Đăng nhập thành công.");
		assertThat(response.accessToken()).isEqualTo("access-token");
		assertThat(response.refreshToken()).isNotBlank();
		assertThat(response.user()).isEqualTo(new AuthUserResponse(USER_ID, "Teacher", EMAIL, role.name()));
		verify(authUserRepository).findByEmail(EMAIL);

		ArgumentCaptor<com.english_hub.core.modules.user.domain.model.UserRole> roleCaptor =
				ArgumentCaptor.forClass(com.english_hub.core.modules.user.domain.model.UserRole.class);
		verify(jwtTokenService).createAccessToken(eq(USER_ID), roleCaptor.capture());
		assertThat(roleCaptor.getValue())
				.isEqualTo(com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name()));

		ArgumentCaptor<Long> userIdCaptor = ArgumentCaptor.forClass(Long.class);
		ArgumentCaptor<String> hashCaptor = ArgumentCaptor.forClass(String.class);
		verify(refreshTokenRepository).create(
				userIdCaptor.capture(), hashCaptor.capture(), any(), eq("TestAgent"), eq("127.0.0.1"));
		assertThat(userIdCaptor.getValue()).isEqualTo(USER_ID);
		assertThat(hashCaptor.getValue()).isEqualTo(TokenHasher.sha256(response.refreshToken()));
	}

	private LoginCommand loginCommand() {
		return new LoginCommand(EMAIL, PASSWORD, "TestAgent", "127.0.0.1");
	}

	@Test
	void logoutRejectsBlankToken() {
		assertThatThrownBy(() -> authService.logout(new LogoutCommand(" ")))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_REQUEST));
	}

	@Test
	void logoutReturnsNotFoundForUnknownToken() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.logout(logoutCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.NOT_FOUND));
	}

	@Test
	void logoutRevokesTheToken() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(validToken()));

		var response = authService.logout(logoutCommand());

		verify(refreshTokenRepository).revokeByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN));
		assertThat(response.message()).isEqualTo("Đăng xuất thành công.");
	}

	private LogoutCommand logoutCommand() {
		return new LogoutCommand(RAW_REFRESH_TOKEN);
	}

	@Test
	void refreshRejectsBlankToken() {
		assertThatThrownBy(() -> authService.refresh(new RefreshCommand(" ")))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_REQUEST));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void refreshRejectsUnknownToken() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void refreshRejectsRevokedToken() {
		RefreshToken token = validToken();
		token.setRevokedAt(Instant.now().minusSeconds(1));
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(token));

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void refreshRejectsExpiredToken() {
		RefreshToken token = validToken();
		token.setExpiresAt(Instant.now().minusSeconds(1));
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(token));

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void refreshRejectsTokenWhenUserLookupReturnsEmpty() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(validToken()));
		when(authUserRepository.findById(USER_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void refreshRejectsLockedUser() {
		AuthUser locked = activeTeacher(PASSWORD);
		locked.setStatus(UserStatus.LOCKED);
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(validToken()));
		when(authUserRepository.findById(USER_ID)).thenReturn(Optional.of(locked));

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.FORBIDDEN));
		assertNoAuthenticationSideEffects();
	}

	@Test
	void refreshSucceedsAndMintsANewAccessToken() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(validToken()));
		when(authUserRepository.findById(USER_ID)).thenReturn(Optional.of(activeTeacher(PASSWORD)));
		when(jwtTokenService.createAccessToken(eq(USER_ID), any(
				com.english_hub.core.modules.user.domain.model.UserRole.class))).thenReturn("new-access-token");

		var response = authService.refresh(refreshCommand());

		assertThat(response.message()).isEqualTo("Đã làm mới access token.");
		assertThat(response.accessToken()).isEqualTo("new-access-token");
		ArgumentCaptor<com.english_hub.core.modules.user.domain.model.UserRole> roleCaptor =
				ArgumentCaptor.forClass(com.english_hub.core.modules.user.domain.model.UserRole.class);
		verify(jwtTokenService).createAccessToken(eq(USER_ID), roleCaptor.capture());
		assertThat(roleCaptor.getValue()).isEqualTo(com.english_hub.core.modules.user.domain.model.UserRole.TEACHER);
	}

	@Test
	void forgotPasswordSendsOtpEmailForExistingUser() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeTeacher(PASSWORD)));

		var response = authService.forgotPassword(new ForgotPasswordCommand(EMAIL));

		assertThat(response.email()).isEqualTo(EMAIL);
		assertThat(response.message()).contains("gửi");

		ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
		ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
		verify(emailService).sendPasswordResetOtp(eq(EMAIL), otpCaptor.capture(), urlCaptor.capture(), eq(15));
		assertThat(otpCaptor.getValue()).hasSize(6).containsOnlyDigits();
		assertThat(urlCaptor.getValue()).startsWith("http://localhost:5173/reset-password")
				.contains("email=" + EMAIL)
				.contains("token=");
	}

	@Test
	void forgotPasswordRejectsUnknownEmail() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.forgotPassword(new ForgotPasswordCommand(EMAIL)))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.NOT_FOUND));
		verify(emailService, never()).sendPasswordResetOtp(any(), any(), any(), anyInt());
		assertNoAuthenticationSideEffects();
	}

	@Test
	void resetPasswordUpdatesPasswordWhenOtpIsValid() {
		AuthUser user = activeTeacher(PASSWORD);
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

		String otp = requestOtp();

		var resetResp = authService.resetPassword(
				new ResetPasswordCommand(EMAIL, otp, null, "BrandNewPassword123!"));

		assertThat(resetResp.message()).contains("thành công");
		verify(authUserRepository).save(user);
		verify(refreshTokenRepository).revokeAllByUserId(USER_ID);
		assertThat(passwordEncoder.matches("BrandNewPassword123!", user.getPasswordHash())).isTrue();
	}

	@Test
	void resetPasswordRevokesEveryActiveSession() {
		AuthUser user = activeTeacher(PASSWORD);
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
		when(refreshTokenRepository.revokeAllByUserId(USER_ID)).thenReturn(2);

		String otp = requestOtp();

		var resetResp = authService.resetPassword(
				new ResetPasswordCommand(EMAIL, otp, null, "BrandNewPassword123!"));

		assertThat(resetResp.message()).contains("thành công");
		verify(refreshTokenRepository).revokeAllByUserId(USER_ID);
	}

	@Test
	void resetPasswordDoesNotRevokeSessionsWhenChallengeIsInvalid() {
		assertThatThrownBy(() -> authService.resetPassword(
				new ResetPasswordCommand(EMAIL, "000000", null, "BrandNewPassword123!")))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_REQUEST));

		verify(authUserRepository, never()).save(any());
		verify(refreshTokenRepository, never()).revokeAllByUserId(any());
		assertNoAuthenticationSideEffects();
	}

	@Test
	void resetPasswordRejectsMissingUserAfterValidChallenge() {
		passwordResetStore.store(EMAIL, "000000", RAW_REFRESH_TOKEN, 900);
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.resetPassword(
				new ResetPasswordCommand(EMAIL, null, RAW_REFRESH_TOKEN, PASSWORD)))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
		assertNoAuthenticationSideEffects();
	}

	private void assertNoAuthenticationSideEffects() {
		verifyNoInteractions(jwtTokenService, emailService);
		verify(authUserRepository, never()).save(any());
		verify(refreshTokenRepository, never()).create(any(), any(), any(), any(), any());
		verify(refreshTokenRepository, never()).save(any());
		verify(refreshTokenRepository, never()).revokeAllByUserId(any());
	}

	/** Runs the forgot-password flow and returns the OTP that was emailed out. */
	private String requestOtp() {
		authService.forgotPassword(new ForgotPasswordCommand(EMAIL));
		ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
		verify(emailService).sendPasswordResetOtp(eq(EMAIL), otpCaptor.capture(), any(), eq(15));
		return otpCaptor.getValue();
	}

	private RefreshCommand refreshCommand() {
		return new RefreshCommand(RAW_REFRESH_TOKEN);
	}

	private RefreshToken validToken() {
		RefreshToken token = new RefreshToken();
		token.setId(1L);
		token.setUserId(USER_ID);
		token.setTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN));
		token.setExpiresAt(Instant.now().plusSeconds(3600));
		token.setRevokedAt(null);
		return token;
	}

	private AuthUser activeTeacher(String password) {
		AuthUser user = new AuthUser();
		user.setId(USER_ID);
		user.setFullName("Teacher");
		user.setEmail(EMAIL);
		user.setPasswordHash(passwordEncoder.encode(password));
		user.setRole(UserRole.TEACHER);
		user.setStatus(UserStatus.ACTIVE);
		return user;
	}
}
