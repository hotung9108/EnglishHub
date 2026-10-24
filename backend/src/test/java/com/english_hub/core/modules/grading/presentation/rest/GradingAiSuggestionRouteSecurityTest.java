package com.english_hub.core.modules.grading.presentation.rest;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.infrastructure.security.ApiAccessDeniedHandler;
import com.english_hub.core.infrastructure.security.ApiAuthenticationEntryPoint;
import com.english_hub.core.infrastructure.security.JwtAuthenticationFilter;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.infrastructure.security.SecurityConfig;
import com.english_hub.core.modules.grading.application.service.GradingService;
import com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse;
import com.english_hub.core.modules.user.domain.model.UserRole;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

@WebMvcTest(
		controllers = GradingController.class,
		properties = {
				GradingAiSuggestionRouteSecurityTest.JWT_SECRET_PROPERTY,
				GradingAiSuggestionRouteSecurityTest.JWT_ISSUER_PROPERTY,
				GradingAiSuggestionRouteSecurityTest.JWT_TTL_PROPERTY
		})
@Import({
		SecurityConfig.class,
		JwtAuthenticationFilter.class,
		JwtTokenService.class,
		ApiAuthenticationEntryPoint.class,
		ApiAccessDeniedHandler.class,
		GlobalExceptionHandler.class,
		GradingAiSuggestionRouteSecurityTest.JsonConfiguration.class
})
@MockitoBean(types = GradingService.class)
class GradingAiSuggestionRouteSecurityTest {

	private static final String JWT_SECRET = "englishhub-route-security-secret-with-at-least-32-bytes";
	private static final String OTHER_JWT_SECRET = "englishhub-route-security-different-secret-with-32-bytes";
	private static final String JWT_ISSUER = "englishhub-route-security-test";
	private static final long ACCESS_TOKEN_TTL_SECONDS = 900L;
	private static final long EXPIRED_TOKEN_TTL_SECONDS = -1L;
	static final String JWT_SECRET_PROPERTY = "app.security.jwt-secret=" + JWT_SECRET;
	static final String JWT_ISSUER_PROPERTY = "app.security.jwt-issuer=" + JWT_ISSUER;
	static final String JWT_TTL_PROPERTY =
			"app.security.access-token-ttl-seconds=" + ACCESS_TOKEN_TTL_SECONDS;
	private static final String AI_SUGGESTION_PATH =
			"/api/v1/submission-modules/{id}/grading/ai-suggestion";
	private static final String BEARER_PREFIX = "Bearer ";
	private static final long TEACHER_ID = 9L;
	private static final long STUDENT_ID = 28L;
	private static final long ADMIN_ID = 1L;
	private static final long SUBMISSION_MODULE_ID = 11L;
	private static final long GRADING_ID = 7L;
	private static final String WRITING_SKILL = "WRITING";
	private static final String AI_GRADED_STATUS = "AI_GRADED";
	private static final BigDecimal MAX_SCORE = new BigDecimal("20.00");

	private final MockMvc mockMvc;
	private final JwtTokenService jwtTokenService;
	private final GradingService gradingService;
	private final ObjectMapper objectMapper;

	@Autowired
	GradingAiSuggestionRouteSecurityTest(
			MockMvc mockMvc,
			JwtTokenService jwtTokenService,
			GradingService gradingService,
			ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.jwtTokenService = jwtTokenService;
		this.gradingService = gradingService;
		this.objectMapper = objectMapper;
	}

	@Test
	void teacherWithValidTokenCanReadAiSuggestionAndReachesGradingService() throws Exception {
		when(gradingService.getAiSuggestion(SUBMISSION_MODULE_ID)).thenReturn(writingSuggestion());
		String token = jwtTokenService.createAccessToken(TEACHER_ID, UserRole.TEACHER);

		ResultActions response = mockMvc.perform(get(AI_SUGGESTION_PATH, SUBMISSION_MODULE_ID)
				.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token));

		response.andExpect(status().isOk());
		verify(gradingService).getAiSuggestion(SUBMISSION_MODULE_ID);
	}

	@Test
	void requestWithoutTokenIsUnauthorizedAndDoesNotReachGradingService() throws Exception {
		ResultActions response = mockMvc.perform(get(AI_SUGGESTION_PATH, SUBMISSION_MODULE_ID));

		verifyNoInteractions(gradingService);
		response.andExpect(status().isUnauthorized());
	}

	@Test
	void studentIsForbiddenAndDoesNotReachGradingService() throws Exception {
		String token = jwtTokenService.createAccessToken(STUDENT_ID, UserRole.STUDENT);

		ResultActions response = mockMvc.perform(get(AI_SUGGESTION_PATH, SUBMISSION_MODULE_ID)
				.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token));

		verifyNoInteractions(gradingService);
		response.andExpect(status().isForbidden());
	}

	@Test
	void adminIsForbiddenAndDoesNotReachGradingService() throws Exception {
		String token = jwtTokenService.createAccessToken(ADMIN_ID, UserRole.ADMIN);

		ResultActions response = mockMvc.perform(get(AI_SUGGESTION_PATH, SUBMISSION_MODULE_ID)
				.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token));

		verifyNoInteractions(gradingService);
		response.andExpect(status().isForbidden());
	}

	@Test
	void tokenSignedWithAnotherSecretIsUnauthorizedAndDoesNotReachGradingService() throws Exception {
		JwtTokenService otherSigner = new JwtTokenService(
				objectMapper, OTHER_JWT_SECRET, JWT_ISSUER, ACCESS_TOKEN_TTL_SECONDS);
		String token = otherSigner.createAccessToken(TEACHER_ID, UserRole.TEACHER);

		ResultActions response = mockMvc.perform(get(AI_SUGGESTION_PATH, SUBMISSION_MODULE_ID)
				.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token));

		verifyNoInteractions(gradingService);
		response.andExpect(status().isUnauthorized());
	}

	@Test
	void expiredTokenIsUnauthorizedAndDoesNotReachGradingService() throws Exception {
		JwtTokenService expiredSigner = new JwtTokenService(
				objectMapper, JWT_SECRET, JWT_ISSUER, EXPIRED_TOKEN_TTL_SECONDS);
		String token = expiredSigner.createAccessToken(TEACHER_ID, UserRole.TEACHER);

		ResultActions response = mockMvc.perform(get(AI_SUGGESTION_PATH, SUBMISSION_MODULE_ID)
				.header(HttpHeaders.AUTHORIZATION, BEARER_PREFIX + token));

		verifyNoInteractions(gradingService);
		response.andExpect(status().isUnauthorized());
	}

	private AiGradingSuggestionResponse writingSuggestion() {
		return new AiGradingSuggestionResponse(
				SUBMISSION_MODULE_ID,
				GRADING_ID,
				WRITING_SKILL,
				AI_GRADED_STATUS,
				null,
				MAX_SCORE,
				null,
				null,
				null,
				List.of(),
				null,
				null,
				null,
				false,
				true,
				null);
	}

	@TestConfiguration(proxyBeanMethods = false)
	@EnableWebSecurity
	static class JsonConfiguration {

		@Bean
		FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(
				JwtAuthenticationFilter filter) {
			FilterRegistrationBean<JwtAuthenticationFilter> registration =
					new FilterRegistrationBean<>(filter);
			registration.setEnabled(false);
			return registration;
		}

		@Bean
		ObjectMapper objectMapper() {
			return JsonMapper.builder().build();
		}
	}
}
