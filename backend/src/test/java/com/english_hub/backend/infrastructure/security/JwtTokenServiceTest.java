package com.english_hub.backend.infrastructure.security;

import com.english_hub.backend.features.user.domain.model.UserRole;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenServiceTest {

	private static final String SECRET = "englishhub-test-secret-with-at-least-32-bytes";
	private static final Instant NOW = Instant.parse("2026-09-14T00:00:00Z");

	@Test
	void createsAndParsesAnAccessToken() {
		JwtTokenService service = service(Clock.fixed(NOW, ZoneOffset.UTC));

		String token = service.createAccessToken(12L, UserRole.TEACHER);

		assertThat(service.parse(token)).contains(new JwtPrincipal(12L, UserRole.TEACHER));
	}

	@Test
	void rejectsTamperedAndExpiredTokens() {
		JwtTokenService service = service(Clock.fixed(NOW, ZoneOffset.UTC));
		String token = service.createAccessToken(12L, UserRole.TEACHER);

		assertThat(service.parse(token + "tampered")).isEmpty();
		JwtTokenService expiredService = service(Clock.fixed(NOW.plusSeconds(901), ZoneOffset.UTC));
		assertThat(expiredService.parse(token)).isEmpty();
	}

	private JwtTokenService service(Clock clock) {
		return new JwtTokenService(JsonMapper.builder().build(), SECRET, "englishhub", 900, clock);
	}
}
