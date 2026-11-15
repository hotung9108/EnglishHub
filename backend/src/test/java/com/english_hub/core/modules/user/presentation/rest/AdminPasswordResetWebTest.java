package com.english_hub.core.modules.user.presentation.rest;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.common.config.CacheConfig;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.security.ApiAccessDeniedHandler;
import com.english_hub.core.infrastructure.security.ApiAuthenticationEntryPoint;
import com.english_hub.core.infrastructure.security.JwtAuthenticationFilter;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.infrastructure.security.SecurityConfig;
import com.english_hub.core.modules.user.application.port.PasswordGenerator;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import com.english_hub.core.modules.user.infrastructure.cache.UserSnapshotCache;
import com.english_hub.core.modules.user.infrastructure.security.AuthenticatedUserProvider;
import com.english_hub.core.modules.user.infrastructure.security.SecureRandomPasswordGenerator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminUserController.class, properties = {
		"app.security.jwt-secret=englishhub-be78-test-secret-with-at-least-32-bytes",
		"app.security.jwt-issuer=englishhub-be78-test",
		"app.security.access-token-ttl-seconds=900",
		"app.cache.enabled=true",
		"spring.cache.type=caffeine"
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenService.class,
		ApiAuthenticationEntryPoint.class, ApiAccessDeniedHandler.class, GlobalExceptionHandler.class,
		AdminUserService.class, AuthenticatedUserProvider.class, UserSnapshotCache.class, CacheConfig.class,
		AdminPasswordResetWebTest.JsonConfiguration.class})
@MockitoBean(types = {UserRepository.class, PasswordGenerator.class})
@MockitoSpyBean(types = AdminUserService.class)
class AdminPasswordResetWebTest {

	private static final String SECRET = "englishhub-be78-test-secret-with-at-least-32-bytes";
	private static final String ISSUER = "englishhub-be78-test";
	private static final String RESET_PATH = "/api/v1/admin/users/%s/reset-password";
	private static final String GENERATED_PASSWORD = new SecureRandomPasswordGenerator().generate();
	private static final Set<String> EXPECTED_RESPONSE_FIELDS = Set.of("message", "newPassword");

	private final MockMvc mockMvc;
	private final JwtTokenService jwtTokenService;
	private final UserRepository userRepository;
	private final PasswordGenerator passwordGenerator;
	private final AdminUserService adminUserService;
	private final CacheManager cacheManager;
	private final ObjectMapper objectMapper;
	private final Map<Long, User> users = new HashMap<>();

	@Autowired
	AdminPasswordResetWebTest(
			MockMvc mockMvc,
			JwtTokenService jwtTokenService,
			UserRepository userRepository,
			PasswordGenerator passwordGenerator,
			AdminUserService adminUserService,
			CacheManager cacheManager,
			ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.jwtTokenService = jwtTokenService;
		this.userRepository = userRepository;
		this.passwordGenerator = passwordGenerator;
		this.adminUserService = adminUserService;
		this.cacheManager = cacheManager;
		this.objectMapper = objectMapper;
	}

	@BeforeEach
	void setUp() {
		assertThat(cacheManager.getCache(CacheConfig.USERS)).isInstanceOf(CaffeineCache.class);
		cacheManager.getCache(CacheConfig.USERS).clear();
		users.clear();
		users.put(1L, user(1L, "Hoàng Thanh Ngân", "hoang.thanh.ngan@utc-polyglot.edu.vn",
				UserRole.ADMIN, UserStatus.ACTIVE));
		users.put(2L, user(2L, "Ngô Hoàng Vinh", "ngo.hoang.vinh@utc-polyglot.edu.vn",
				UserRole.ADMIN, UserStatus.ACTIVE));
		users.put(4L, user(4L, "Phạm Diệu Anh", "pham.dieu.anh@gmail.com",
				UserRole.TEACHER, UserStatus.ACTIVE));
		users.put(12L, user(12L, "Ngô Thị Phương", "ngo.thi.phuong@gmail.com",
				UserRole.STUDENT, UserStatus.ACTIVE));
		users.put(27L, user(27L, "Phan Quốc Tùng", "phan.quoc.tung@gmail.com",
				UserRole.STUDENT, UserStatus.LOCKED));
		when(userRepository.findById(anyLong())).thenAnswer(invocation ->
				Optional.ofNullable(users.get(invocation.getArgument(0, Long.class)))
						.filter(candidate -> !candidate.deleted()));
		when(passwordGenerator.generate()).thenReturn(GENERATED_PASSWORD);
	}

	@Test
	void resetPassword_whenAdminCallsValidTarget_returnsPasswordAndNoStoreHeaders() throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(12L)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());

		assertThat(result.getResponse().getStatus()).isEqualTo(200);
		assertResponseBody(body);
		assertThat(result.getResponse().getHeader(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store");
		assertThat(result.getResponse().getHeader(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
		assertThat(result.getResponse().getHeader(HttpHeaders.EXPIRES)).isEqualTo("0");
		verify(userRepository).save(any(User.class));
		verify(passwordGenerator).generate();
	}

	@Test
	void resetPassword_whenTargetIsAnotherAdmin_returns200() throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(2L)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();

		assertThat(result.getResponse().getStatus()).isEqualTo(200);
		assertResponseBody(objectMapper.readTree(result.getResponse().getContentAsString()));
		verify(userRepository).save(any(User.class));
	}

	@Test
	void resetPassword_whenTargetIsLocked_keepsItLocked() throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(27L)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();

		assertThat(result.getResponse().getStatus()).isEqualTo(200);
		assertResponseBody(objectMapper.readTree(result.getResponse().getContentAsString()));
		assertThat(users.get(27L).status()).isEqualTo(UserStatus.LOCKED);
	}

	@Test
	void resetPassword_whenTokenIsMissing_returns401WithoutCallingReset() throws Exception {
		mockMvc.perform(post(resetPath(12L))).andExpect(status().isUnauthorized());

		verifyNoInteractions(userRepository, passwordGenerator);
		verify(adminUserService, never()).resetPassword(anyLong());
	}

	@ParameterizedTest
	@ValueSource(strings = {"Bearer ", "Bearer malformed-token"})
	void resetPassword_whenBearerTokenIsEmptyOrMalformed_returns401(String authorization) throws Exception {
		mockMvc.perform(post(resetPath(12L)).header(HttpHeaders.AUTHORIZATION, authorization))
				.andExpect(status().isUnauthorized());

		verifyNoInteractions(userRepository, passwordGenerator);
		verify(adminUserService, never()).resetPassword(anyLong());
	}

	@Test
	void resetPassword_whenSignatureIsInvalid_returns401() throws Exception {
		JwtTokenService otherSigner = new JwtTokenService(
				objectMapper, "englishhub-be78-other-test-secret-with-32-bytes", ISSUER, 900L);

		assertUnauthorized(otherSigner.createAccessToken(1L, domainRole(UserRole.ADMIN)));
	}

	@Test
	void resetPassword_whenTokenIsExpired_returns401() throws Exception {
		JwtTokenService expiredSigner = new JwtTokenService(objectMapper, SECRET, ISSUER, -1L);

		assertUnauthorized(expiredSigner.createAccessToken(1L, domainRole(UserRole.ADMIN)));
	}

	@ParameterizedTest
	@ValueSource(longs = {4L, 12L})
	void resetPassword_whenCallerIsTeacherOrStudent_returns403WithoutReset(long callerId) throws Exception {
		mockMvc.perform(post(resetPath(12L)).header(HttpHeaders.AUTHORIZATION, bearer(callerId)))
				.andExpect(status().isForbidden());

		verifyNoInteractions(userRepository, passwordGenerator);
		verify(adminUserService, never()).resetPassword(anyLong());
	}

	@Test
	void resetPassword_whenNonAdminUsesMalformedId_returns403BeforeIdBinding() throws Exception {
		mockMvc.perform(post(resetPath("abc")).header(HttpHeaders.AUTHORIZATION, bearer(4L)))
				.andExpect(status().isForbidden());

		verifyNoInteractions(userRepository, passwordGenerator);
		verify(adminUserService, never()).resetPassword(anyLong());
	}

	@Test
	void resetPassword_whenAdminCallerIsLocked_returns401() throws Exception {
		users.get(1L).changeStatus(UserStatus.LOCKED);

		assertRejectedAdmin();
	}

	@Test
	void resetPassword_whenAdminCallerIsSoftDeleted_returns401() throws Exception {
		users.get(1L).softDelete();

		assertRejectedAdmin();
	}

	@Test
	void resetPassword_whenAdminCallerNoLongerExists_returns401() throws Exception {
		users.remove(1L);

		assertRejectedAdmin();
	}

	@ParameterizedTest
	@ValueSource(strings = {"abc", "1.5", "9223372036854775808", "-9223372036854775809"})
	void resetPassword_whenIdCannotBindToLong_returns400WithExistingError(String id) throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(id)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());

		assertThat(result.getResponse().getStatus()).isEqualTo(400);
		assertThat(body.path("error").asString().equals("Dữ liệu không hợp lệ.")).isTrue();
		verify(adminUserService, never()).resetPassword(anyLong());
		verifyNoInteractions(passwordGenerator);
	}

	@Test
	void resetPassword_whenIdContainsWhitespace_returns400WithoutCallingReset() throws Exception {
		String path = "/api/v1/admin/users/%20/reset-password";
		mockMvc.perform(post(path).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isBadRequest());
		verify(adminUserService, never()).resetPassword(anyLong());
	}

	@ParameterizedTest
	@ValueSource(longs = {0L, -1L, Long.MIN_VALUE})
	void resetPassword_whenIdIsNonpositive_returns404WithoutTargetLookup(long id) throws Exception {
		assertNotFound(id);

		verify(userRepository, never()).findById(id);
		verify(passwordGenerator, never()).generate();
	}

	@Test
	void resetPassword_whenLongMaxTargetDoesNotExist_returns404() throws Exception {
		assertNotFound(Long.MAX_VALUE);
		verify(userRepository).findById(Long.MAX_VALUE);
	}

	@Test
	void resetPassword_whenTargetIsSoftDeleted_returns404() throws Exception {
		users.get(12L).softDelete();

		assertNotFound(12L);
		verify(passwordGenerator, never()).generate();
	}

	@Test
	void resetPassword_whenAdminResetsSelf_returns400() throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(1L)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());

		assertThat(result.getResponse().getStatus()).isEqualTo(400);
		assertThat(body.path("error").asString().equals(
				"Vui lòng sử dụng chức năng đổi mật khẩu của chính mình.")).isTrue();
		verify(passwordGenerator, never()).generate();
		verify(userRepository, never()).save(any(User.class));
	}

	@ParameterizedTest
	@ValueSource(strings = {"GET", "PUT", "PATCH", "DELETE", "HEAD"})
	void resetPassword_whenMethodIsNotPost_preservesRoutePolicyBehavior(String method) throws Exception {
		mockMvc.perform(request(HttpMethod.valueOf(method), resetPath(12L))
				.header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isForbidden());

		verify(adminUserService, never()).resetPassword(anyLong());
		verify(passwordGenerator, never()).generate();
	}

	@Test
	void resetPassword_whenBodyContainsPassword_ignoresBodyAndReturnsGeneratedPassword() throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(12L))
				.header(HttpHeaders.AUTHORIZATION, bearer(1L))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"newPassword\":\"x\"}"))
				.andReturn();

		assertSuccessfulGeneratedResponse(result);
	}

	@Test
	void resetPassword_whenContentTypeIsUnsupported_ignoresBodyAndReturnsGeneratedPassword() throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(12L))
				.header(HttpHeaders.AUTHORIZATION, bearer(1L))
				.contentType(MediaType.parseMediaType("application/x-reset-password-test"))
				.content("payload"))
				.andReturn();

		assertSuccessfulGeneratedResponse(result);
	}

	@Test
	void resetPassword_whenAdminIsLockedAndIdIsMalformed_observesMvcBindingOrder() throws Exception {
		users.get(1L).changeStatus(UserStatus.LOCKED);
		MvcResult result = mockMvc.perform(post(resetPath("abc")).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();

		System.out.println("Observed locked-admin plus malformed ID response status: "
				+ result.getResponse().getStatus());
	}

	private void assertSuccessfulGeneratedResponse(MvcResult result) throws Exception {
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(result.getResponse().getStatus()).isEqualTo(200);
		assertResponseBody(body);
		assertThat(body.path("newPassword").asString().equals("x")).isFalse();
	}

	private void assertResponseBody(JsonNode body) {
		Set<String> fields = body.properties().stream().map(field -> field.getKey())
				.collect(java.util.stream.Collectors.toSet());
		assertThat(body.isObject()).isTrue();
		assertThat(fields.equals(EXPECTED_RESPONSE_FIELDS)).isTrue();
		assertThat(body.size()).isEqualTo(2);
		assertThat(body.path("message").asString().equals("Đặt lại mật khẩu thành công.")).isTrue();
		assertThat(body.path("newPassword").asString().equals(GENERATED_PASSWORD)).isTrue();
	}

	private void assertUnauthorized(String token) throws Exception {
		mockMvc.perform(post(resetPath(12L)).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized());
		verifyNoInteractions(userRepository, passwordGenerator);
		verify(adminUserService, never()).resetPassword(anyLong());
	}

	private void assertRejectedAdmin() throws Exception {
		mockMvc.perform(post(resetPath(12L)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isUnauthorized());
		verify(userRepository, never()).findById(12L);
		verify(passwordGenerator, never()).generate();
	}

	private void assertNotFound(long id) throws Exception {
		MvcResult result = mockMvc.perform(post(resetPath(id)).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andReturn();
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(result.getResponse().getStatus()).isEqualTo(404);
		assertThat(body.path("error").asString().equals("Không tìm thấy người dùng.")).isTrue();
		verify(passwordGenerator, never()).generate();
	}

	private String bearer(long userId) {
		User user = users.get(userId);
		UserRole role = user == null ? UserRole.ADMIN : user.role();
		return "Bearer " + jwtTokenService.createAccessToken(userId, domainRole(role));
	}

	private String resetPath(long userId) {
		return resetPath(Long.toString(userId));
	}

	private String resetPath(String id) {
		return RESET_PATH.formatted(id);
	}

	private User user(long id, String fullName, String email, UserRole role, UserStatus status) {
		return new User(id, fullName, email, null, null, "test-password-hash", role, status, false,
				null, null, null, null);
	}

	private com.english_hub.core.modules.user.domain.model.UserRole domainRole(UserRole role) {
		return com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
	}

	@TestConfiguration(proxyBeanMethods = false)
	@EnableWebSecurity
	static class JsonConfiguration {

		@Bean
		FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration(JwtAuthenticationFilter filter) {
			FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
			registration.setEnabled(false);
			return registration;
		}

		@Bean
		ObjectMapper objectMapper() {
			return JsonMapper.builder().build();
		}
	}

}
