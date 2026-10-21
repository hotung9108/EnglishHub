package com.english_hub.core.infrastructure.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Configuration
public class SecurityConfig {

	private static final Logger LOGGER = LoggerFactory.getLogger(SecurityConfig.class);

	@Bean
	SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			JwtAuthenticationFilter jwtAuthenticationFilter,
			ApiAuthenticationEntryPoint authenticationEntryPoint,
			ApiAccessDeniedHandler accessDeniedHandler) throws Exception {
		http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> {})
				.formLogin(form -> form.disable())
				.httpBasic(basic -> basic.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.exceptionHandling(exception -> exception
						.authenticationEntryPoint(authenticationEntryPoint)
						.accessDeniedHandler(accessDeniedHandler))
				.authorizeHttpRequests(authorize -> {
					authorize.requestMatchers(
							"/actuator/health",
							"/error",
							"/swagger-ui.html",
							"/swagger-ui/**",
							"/v3/api-docs/**",
							"/swagger-resources/**",
							"/webjars/**").permitAll();
					for (ApiRoutePolicy.RouteRule route : ApiRoutePolicy.routes()) {
						var requestMatcher = authorize.requestMatchers(route.method(), route.pathPattern());
						if (route.roles().isEmpty()) {
							requestMatcher.permitAll();
						} else {
							requestMatcher.hasAnyRole(route.roles().toArray(String[]::new));
						}
					}
					authorize.anyRequest().denyAll();
				})
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(
			@Value("${app.security.cors.allowed-origins:*}") String[] allowedOrigins) {
		var config = new CorsConfiguration();
		List<String> origins = sanitizeOrigins(allowedOrigins);
		if (origins.isEmpty() || origins.contains(CorsConfiguration.ALL)) {
			// Fallback: missing/empty/wildcard config keeps legacy behaviour (allow all).
			config.setAllowedOriginPatterns(List.of(CorsConfiguration.ALL));
			LOGGER.warn("CORS allowed-origins is empty or wildcard (*) - every origin is accepted WITH credentials. "
					+ "Set CORS_ALLOWED_ORIGINS to the real frontend domains for production.");
		} else if (origins.stream().anyMatch(origin -> origin.contains("*"))) {
			// Entries like https://*.hotung9108.me need pattern matching.
			config.setAllowedOriginPatterns(origins);
			LOGGER.info("CORS allowed origins (pattern mode): {}", origins);
		} else {
			// Exact origins only - no pattern/regex semantics, strictest matching.
			config.setAllowedOrigins(origins);
			LOGGER.info("CORS allowed origins (exact mode): {}", origins);
		}
		config.setAllowedMethods(List.of(
				HttpMethod.GET.name(),
				HttpMethod.POST.name(),
				HttpMethod.PUT.name(),
				HttpMethod.PATCH.name(),
				HttpMethod.DELETE.name(),
				HttpMethod.OPTIONS.name()));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);
		config.setMaxAge(3600L);
		var source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	/**
	 * Chuẩn hóa danh sách origins từ CORS_ALLOWED_ORIGINS: trim khoảng trắng,
	 * bỏ entry rỗng, bỏ dấu '/' cuối cùng (ví dụ 'https://app.example.com/'
	 * phải khớp chính xác 'https://app.example.com').
	 */
	static List<String> sanitizeOrigins(String[] allowedOrigins) {
		if (allowedOrigins == null) {
			return List.of();
		}
		return Arrays.stream(allowedOrigins)
				.filter(Objects::nonNull)
				.map(String::trim)
				.map(origin -> origin.replaceAll("/+$", ""))
				.filter(origin -> !origin.isEmpty())
				.distinct()
				.toList();
	}
}
