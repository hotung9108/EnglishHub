package com.english_hub.core.modules.auth.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.auth.application.command.LoginCommand;
import com.english_hub.core.modules.auth.application.command.LogoutCommand;
import com.english_hub.core.modules.auth.application.command.RefreshCommand;
import com.english_hub.core.modules.auth.domain.model.AuthUser;
import com.english_hub.core.modules.auth.domain.model.RefreshToken;
import com.english_hub.core.modules.auth.domain.repository.AuthUserRepository;
import com.english_hub.core.modules.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.core.modules.auth.domain.service.TokenHasher;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.AuthUserResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.LogoutResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.RefreshResponse;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.auth.application.command.ForgotPasswordCommand;
import com.english_hub.core.modules.auth.application.command.ResetPasswordCommand;
import com.english_hub.core.modules.auth.domain.service.PasswordResetStore;
import com.english_hub.core.modules.auth.presentation.rest.dto.ForgotPasswordResponse;
import com.english_hub.core.modules.auth.presentation.rest.dto.ResetPasswordResponse;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);
	private static final int USER_AGENT_MAX_LENGTH = 255;
	private static final int IP_ADDRESS_MAX_LENGTH = 45;

	private final AuthUserRepository authUserRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenService jwtTokenService;
	private final PasswordResetStore passwordResetStore;
	private final long refreshTokenTtlSeconds;

	@Autowired
	public AuthService(
			AuthUserRepository authUserRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtTokenService jwtTokenService,
			PasswordResetStore passwordResetStore,
			@Value("${app.security.refresh-token-ttl-seconds}") long refreshTokenTtlSeconds) {
		this.authUserRepository = authUserRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtTokenService = jwtTokenService;
		this.passwordResetStore = passwordResetStore;
		this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
	}

	@Transactional
	public AuthResponse login(LoginCommand command) {
		if (command == null || !hasText(command.email()) || !hasText(command.password())) {
			throw ApiException.badRequest("Vui lòng nhập email và mật khẩu.");
		}

		AuthUser user = authUserRepository.findByEmail(command.email().trim())
				.orElseThrow(() -> ApiException.notFound("Tài khoản không tồn tại."));

		if (!passwordEncoder.matches(command.password(), user.getPasswordHash())) {
			throw ApiException.unauthorized("Email hoặc mật khẩu không chính xác.");
		}
		if (user.getStatus() == UserStatus.LOCKED) {
			throw ApiException.forbidden("Tài khoản đã bị khoá.");
		}

		String accessToken = jwtTokenService.createAccessToken(user.getId(), toUserFeatureRole(user.getRole()));

		String rawRefreshToken = UUID.randomUUID().toString();
		refreshTokenRepository.create(
				user.getId(),
				TokenHasher.sha256(rawRefreshToken),
				Instant.now().plusSeconds(refreshTokenTtlSeconds),
				truncate(command.userAgent(), USER_AGENT_MAX_LENGTH),
				truncate(command.ipAddress(), IP_ADDRESS_MAX_LENGTH));

		return new AuthResponse("Đăng nhập thành công.", accessToken, rawRefreshToken, AuthUserResponse.from(user));
	}

	@Transactional(readOnly = true)
	public RefreshResponse refresh(RefreshCommand command) {
		if (command == null || !hasText(command.refreshToken())) {
			throw ApiException.badRequest("Vui lòng cung cấp refresh token.");
		}

		RefreshToken token = refreshTokenRepository.findByTokenHash(TokenHasher.sha256(command.refreshToken()))
				.orElseThrow(() -> ApiException.unauthorized("Refresh token không hợp lệ."));
		if (token.getRevokedAt() != null) {
			throw ApiException.unauthorized("Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại.");
		}
		if (token.getExpiresAt().isBefore(Instant.now())) {
			throw ApiException.unauthorized("Refresh token đã hết hạn, vui lòng đăng nhập lại.");
		}

		AuthUser user = authUserRepository.findById(token.getUserId())
				.orElseThrow(() -> ApiException.unauthorized("Refresh token không hợp lệ."));
		if (user.getStatus() == UserStatus.LOCKED) {
			throw ApiException.forbidden("Tài khoản đã bị khoá.");
		}

		String accessToken = jwtTokenService.createAccessToken(user.getId(), toUserFeatureRole(user.getRole()));
		return new RefreshResponse("Đã làm mới access token.", accessToken);
	}

	@Transactional
	public LogoutResponse logout(LogoutCommand command) {
		if (command == null || !hasText(command.refreshToken())) {
			throw ApiException.badRequest("Vui lòng cung cấp refresh token.");
		}

		String tokenHash = TokenHasher.sha256(command.refreshToken());
		refreshTokenRepository.findByTokenHash(tokenHash)
				.orElseThrow(() -> ApiException.notFound("Refresh token không hợp lệ."));

		refreshTokenRepository.revokeByTokenHash(tokenHash);
		return new LogoutResponse("Đăng xuất thành công.");
	}

	@Transactional(readOnly = true)
	public ForgotPasswordResponse forgotPassword(ForgotPasswordCommand command) {
		if (command == null || !hasText(command.email())) {
			throw ApiException.badRequest("Vui lòng cung cấp địa chỉ email.");
		}

		String cleanEmail = command.email().trim().toLowerCase();
		AuthUser user = authUserRepository.findByEmail(cleanEmail)
				.orElseThrow(() -> ApiException.notFound("Tài khoản với email này không tồn tại trong hệ thống."));

		if (user.getStatus() == UserStatus.LOCKED) {
			throw ApiException.forbidden("Tài khoản đã bị khoá.");
		}

		String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(1_000_000));
		String token = UUID.randomUUID().toString();
		long ttlSeconds = 900; // 15 mins
		passwordResetStore.store(cleanEmail, otp, token, ttlSeconds);

		LOGGER.info("Generated password reset OTP for [{}]: OTP={}, token={}", cleanEmail, otp, token);
		return new ForgotPasswordResponse("Mã xác thực đã được gửi đến email của bạn.", cleanEmail, otp);
	}

	@Transactional
	public ResetPasswordResponse resetPassword(ResetPasswordCommand command) {
		if (command == null || !hasText(command.email())) {
			throw ApiException.badRequest("Vui lòng cung cấp địa chỉ email.");
		}
		if (!hasText(command.otp()) && !hasText(command.token())) {
			throw ApiException.badRequest("Vui lòng cung cấp mã OTP hoặc liên kết đặt lại mật khẩu.");
		}
		if (!hasText(command.newPassword()) || command.newPassword().trim().length() < 8) {
			throw ApiException.badRequest("Mật khẩu mới phải có tối thiểu 8 ký tự.");
		}

		String cleanEmail = command.email().trim().toLowerCase();
		boolean verified = passwordResetStore.verifyAndConsume(
				cleanEmail,
				command.otp() == null ? null : command.otp().trim(),
				command.token() == null ? null : command.token().trim());

		if (!verified) {
			throw ApiException.badRequest("Mã xác thực hoặc liên kết không hợp lệ, hoặc đã hết hạn.");
		}

		AuthUser user = authUserRepository.findByEmail(cleanEmail)
				.orElseThrow(() -> ApiException.notFound("Tài khoản không tồn tại."));

		if (user.getStatus() == UserStatus.LOCKED) {
			throw ApiException.forbidden("Tài khoản đã bị khoá.");
		}

		user.setPasswordHash(passwordEncoder.encode(command.newPassword().trim()));
		authUserRepository.save(user);

		LOGGER.info("Password successfully reset for user [{}]", cleanEmail);
		return new ResetPasswordResponse("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");
	}

	private com.english_hub.core.modules.user.domain.model.UserRole toUserFeatureRole(
			com.english_hub.core.common.domain.UserRole role) {
		return com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
	}

	private boolean hasText(String value) {
		return value != null && !value.trim().isEmpty();
	}

	private String truncate(String value, int maxLength) {
		if (value == null || value.length() <= maxLength) {
			return value;
		}
		return value.substring(0, maxLength);
	}
}