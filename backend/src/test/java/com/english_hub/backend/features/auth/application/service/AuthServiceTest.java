package com.english_hub.backend.features.auth.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.features.auth.application.command.LoginCommand;
import com.english_hub.backend.features.auth.application.command.RefreshCommand;
import com.english_hub.backend.features.auth.domain.model.AuthUser;
import com.english_hub.backend.features.auth.domain.model.RefreshToken;
import com.english_hub.backend.features.auth.domain.repository.AuthUserRepository;
import com.english_hub.backend.features.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.backend.features.auth.domain.service.TokenHasher;
import com.english_hub.backend.features.auth.interfaces.rest.dto.AuthResponse;
import com.english_hub.backend.features.auth.interfaces.rest.dto.AuthUserResponse;
import com.english_hub.backend.security.JwtTokenService;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

	@Mock
	private AuthUserRepository authUserRepository;

	@Mock
	private RefreshTokenRepository refreshTokenRepository;

	@Mock
	private JwtTokenService jwtTokenService;

	private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
	private AuthService authService;

	@BeforeEach
	void setUp() {
		authService = new AuthService(
				authUserRepository,
				refreshTokenRepository,
				passwordEncoder,
				jwtTokenService,
				604800L);
	}

	@Test
	void rejectsMissingCredentials() {
		assertThatThrownBy(() -> authService.login(new LoginCommand(null, null, null, null)))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_REQUEST));
	}

	@Test
	void returnsNotFoundForUnknownEmail() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.login(loginCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.NOT_FOUND));
	}

	@Test
	void rejectsWrongPassword() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeTeacher("WrongPass99")));

		assertThatThrownBy(() -> authService.login(loginCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
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
	}

	@Test
	void loginSucceedsAndPersistsTheHashedRefreshToken() {
		when(authUserRepository.findByEmail(EMAIL)).thenReturn(Optional.of(activeTeacher(PASSWORD)));
		when(jwtTokenService.createAccessToken(eq(USER_ID), any(
				com.english_hub.backend.features.user.domain.model.UserRole.class))).thenReturn("access-token");

		AuthResponse response = authService.login(loginCommand());

		assertThat(response.message()).isEqualTo("Đăng nhập thành công.");
		assertThat(response.accessToken()).isEqualTo("access-token");
		assertThat(response.refreshToken()).isNotBlank();
		assertThat(response.user()).isEqualTo(new AuthUserResponse(USER_ID, "Teacher", EMAIL, "TEACHER"));

		ArgumentCaptor<com.english_hub.backend.features.user.domain.model.UserRole> roleCaptor =
				ArgumentCaptor.forClass(com.english_hub.backend.features.user.domain.model.UserRole.class);
		verify(jwtTokenService).createAccessToken(eq(USER_ID), roleCaptor.capture());
		assertThat(roleCaptor.getValue()).isEqualTo(com.english_hub.backend.features.user.domain.model.UserRole.TEACHER);

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
	void refreshRejectsBlankToken() {
		assertThatThrownBy(() -> authService.refresh(new RefreshCommand(" ")))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_REQUEST));
	}

	@Test
	void refreshRejectsUnknownToken() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
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
	}

	@Test
	void refreshRejectsTokenOfDeletedUser() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(validToken()));
		when(authUserRepository.findById(USER_ID)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> authService.refresh(refreshCommand()))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.UNAUTHORIZED));
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
	}

	@Test
	void refreshSucceedsAndMintsANewAccessToken() {
		when(refreshTokenRepository.findByTokenHash(TokenHasher.sha256(RAW_REFRESH_TOKEN)))
				.thenReturn(Optional.of(validToken()));
		when(authUserRepository.findById(USER_ID)).thenReturn(Optional.of(activeTeacher(PASSWORD)));
		when(jwtTokenService.createAccessToken(eq(USER_ID), any(
				com.english_hub.backend.features.user.domain.model.UserRole.class))).thenReturn("new-access-token");

		var response = authService.refresh(refreshCommand());

		assertThat(response.message()).isEqualTo("Đã làm mới access token.");
		assertThat(response.accessToken()).isEqualTo("new-access-token");
		ArgumentCaptor<com.english_hub.backend.features.user.domain.model.UserRole> roleCaptor =
				ArgumentCaptor.forClass(com.english_hub.backend.features.user.domain.model.UserRole.class);
		verify(jwtTokenService).createAccessToken(eq(USER_ID), roleCaptor.capture());
		assertThat(roleCaptor.getValue()).isEqualTo(com.english_hub.backend.features.user.domain.model.UserRole.TEACHER);
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