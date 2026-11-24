package com.english_hub.core.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BUG-17: CORS phải cho phép credential chỉ với origin được khai báo tường minh
 * trong CORS_ALLOWED_ORIGINS. Khi biến rỗng/thiếu, fallback "*" (giữ hành vi cũ).
 */
class CorsSecurityConfigTest {

	private static final String PROD_ORIGIN = "https://hotung9108.me";
	private static final String APP_ORIGIN = "https://app.hotung9108.me";
	private static final String STAGING_ORIGIN = "https://staging.hotung9108.me";
	private static final String EVIL_ORIGIN = "https://evil.example";

	// --- Exact mode -----------------------------------------------------------

	@Test
	void allowsOnlyWhitelistedOrigins() {
		CorsConfiguration config = config(PROD_ORIGIN, APP_ORIGIN, STAGING_ORIGIN);

		assertThat(config.checkOrigin(APP_ORIGIN)).isEqualTo(APP_ORIGIN);
		assertThat(config.checkOrigin(PROD_ORIGIN)).isEqualTo(PROD_ORIGIN);
		assertThat(config.checkOrigin(STAGING_ORIGIN)).isEqualTo(STAGING_ORIGIN);
	}

	@Test
	void rejectsNonWhitelistedOriginWithCredentials() {
		CorsConfiguration config = config(PROD_ORIGIN, APP_ORIGIN);

		// checkOrigin trả về null = request bị chặn, không có header Access-Control-Allow-Origin
		assertThat(config.checkOrigin(EVIL_ORIGIN)).isNull();
	}

	@Test
	void rejectsOriginThatOnlyContainsWhitelistedDomainAsSuffix() {
		CorsConfiguration config = config(APP_ORIGIN);

		// "https://app.hotung9108.me.evil.com" không được khớp entry "https://app.hotung9108.me"
		assertThat(config.checkOrigin("https://app.hotung9108.me.evil.example")).isNull();
		assertThat(config.checkOrigin("https://app-hotung9108.me")).isNull();
		assertThat(config.checkOrigin("http://app.hotung9108.me")).isNull(); // sai scheme
	}

	@Test
	void staysInExactModeWithoutPatternSemantics() {
		CorsConfiguration config = config(APP_ORIGIN);

		assertThat(config.getAllowedOrigins()).containsExactly(APP_ORIGIN);
		assertThat(config.getAllowedOriginPatterns()).isNull();
	}

	// --- Sanitization ---------------------------------------------------------

	@Test
	void trimsWhitespaceAndStripsTrailingSlash() {
		CorsConfiguration config = config(" " + APP_ORIGIN + "/", PROD_ORIGIN + "  ");

		assertThat(config.checkOrigin(APP_ORIGIN)).isEqualTo(APP_ORIGIN);
		assertThat(config.checkOrigin(PROD_ORIGIN)).isEqualTo(PROD_ORIGIN);
		// Origin có '/' cuối vẫn match: sanitizeOrigins bỏ '/' cuối entry,
		// và Spring checkOrigin tự bỏ '/' cuối của request Origin.
		assertThat(config.checkOrigin(APP_ORIGIN + "/")).isEqualTo(APP_ORIGIN + "/");
	}

	// --- Fallback wildcard (yêu cầu: fallback LUÔN là "*" khi rỗng/thiếu) ------

	@Test
	void fallsBackToWildcardWhenOriginsEmpty() {
		CorsConfiguration empty = config();
		CorsConfiguration blank = config("", "   ");

		assertThat(empty.checkOrigin(EVIL_ORIGIN)).isEqualTo(EVIL_ORIGIN);
		assertThat(blank.checkOrigin(EVIL_ORIGIN)).isEqualTo(EVIL_ORIGIN);
	}

	@Test
	void fallsBackToWildcardWhenExplicitStar() {
		CorsConfiguration config = config("*");

		assertThat(config.checkOrigin(EVIL_ORIGIN)).isEqualTo(EVIL_ORIGIN);
	}

	@Test
	void wildcardFallbackStillAllowsCredentials() {
		CorsConfiguration config = config();

		assertThat(config.getAllowCredentials()).isTrue();
		assertThat(config.checkOrigin(EVIL_ORIGIN)).isEqualTo(EVIL_ORIGIN);
	}

	// --- Subdomain wildcard patterns ------------------------------------------

	@Test
	void supportsSubdomainWildcardPatterns() {
		CorsConfiguration config = config("https://*.hotung9108.me");

		assertThat(config.checkOrigin("https://app.hotung9108.me")).isEqualTo("https://app.hotung9108.me");
		assertThat(config.checkOrigin("https://api-staging.hotung9108.me"))
				.isEqualTo("https://api-staging.hotung9108.me");
		assertThat(config.checkOrigin(EVIL_ORIGIN)).isNull();
	}

	// --- Preflight & unchanged settings ----------------------------------------

	@Test
	void preflightSucceedsForWhitelistedOriginAndFailsForEvilOrigin() {
		CorsConfiguration config = config(APP_ORIGIN);

		// Preflight = checkOrigin + checkHttpMethod + checkHeaders (Spring 7 không còn method check() gộp)
		assertThat(config.checkOrigin(APP_ORIGIN)).isEqualTo(APP_ORIGIN);
		assertThat(config.checkHttpMethod(HttpMethod.POST)).contains(HttpMethod.POST);
		assertThat(config.checkHeaders(List.of("content-type"))).containsExactly("content-type");

		// Evil origin bị chặn ngay ở bước checkOrigin -> không có CORS headers nào được trả về
		assertThat(config.checkOrigin(EVIL_ORIGIN)).isNull();
	}

	@Test
	void methodsHeadersAndMaxAgeUnchanged() {
		CorsConfiguration config = config(APP_ORIGIN);

		assertThat(config.getAllowedMethods())
				.containsExactly("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
		assertThat(config.getAllowedHeaders()).containsExactly("*");
		assertThat(config.getMaxAge()).isEqualTo(3600L);
		assertThat(config.getAllowCredentials()).isTrue();
	}

	// --- sanitizeOrigins unit tests ---------------------------------------------

	@Test
	void sanitizeOriginsCleansAndDeduplicates() {
		List<String> result = SecurityConfig.sanitizeOrigins(
				new String[] { " " + PROD_ORIGIN + " ", APP_ORIGIN + "/", "", "   ", PROD_ORIGIN });

		assertThat(result).containsExactly(PROD_ORIGIN, APP_ORIGIN);
	}

	@Test
	void sanitizeOriginsHandlesNullArrayAndNullEntries() {
		assertThat(SecurityConfig.sanitizeOrigins(null)).isEmpty();
		assertThat(SecurityConfig.sanitizeOrigins(new String[] { null, " ", PROD_ORIGIN }))
				.containsExactly(PROD_ORIGIN);
	}

	// --- helpers ----------------------------------------------------------------

	private static CorsConfiguration config(String... origins) {
		CorsConfigurationSource source = new SecurityConfig().corsConfigurationSource(origins);
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/assignments");
		CorsConfiguration config = ((UrlBasedCorsConfigurationSource) source).getCorsConfiguration(request);
		assertThat(config).isNotNull();
		return config;
	}
}
