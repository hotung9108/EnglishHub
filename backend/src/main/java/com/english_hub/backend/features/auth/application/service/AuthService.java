package com.english_hub.backend.features.auth.application.service;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.features.auth.application.command.LoginCommand;
import com.english_hub.backend.features.auth.domain.model.AuthUser;
import com.english_hub.backend.features.auth.domain.repository.AuthUserRepository;
import com.english_hub.backend.features.auth.domain.repository.RefreshTokenRepository;
import com.english_hub.backend.features.auth.domain.service.TokenHasher;
import com.english_hub.backend.features.auth.interfaces.rest.dto.AuthResponse;
import com.english_hub.backend.features.auth.interfaces.rest.dto.AuthUserResponse;
import com.english_hub.backend.security.JwtTokenService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

	private static final int USER_AGENT_MAX_LENGTH = 255;
	private static final int IP_ADDRESS_MAX_LENGTH = 45;

	private final AuthUserRepository authUserRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenService jwtTokenService;
	private final long refreshTokenTtlSeconds;

	@Autowired
	public AuthService(
			AuthUserRepository authUserRepository,
			RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder,
			JwtTokenService jwtTokenService,
			@Value("${app.security.refresh-token-ttl-seconds}") long refreshTokenTtlSeconds) {
		this.authUserRepository = authUserRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtTokenService = jwtTokenService;
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

	private com.english_hub.backend.features.user.domain.model.UserRole toUserFeatureRole(
			com.english_hub.backend.common.domain.UserRole role) {
		return com.english_hub.backend.features.user.domain.model.UserRole.valueOf(role.name());
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