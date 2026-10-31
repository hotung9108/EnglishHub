package com.english_hub.core.modules.user.integration;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.common.config.CacheConfig;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.security.ApiAccessDeniedHandler;
import com.english_hub.core.infrastructure.security.ApiAuthenticationEntryPoint;
import com.english_hub.core.infrastructure.security.ApiRoutePolicy;
import com.english_hub.core.infrastructure.security.JwtAuthenticationFilter;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.infrastructure.security.SecurityConfig;
import com.english_hub.core.modules.user.application.command.UpdateUserCommand;
import com.english_hub.core.modules.user.application.page.UserPageRequest;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.modules.user.application.service.UserProfileService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.model.UserPage;
import com.english_hub.core.modules.user.domain.repository.UserRepository;
import com.english_hub.core.modules.user.infrastructure.cache.UserSnapshotCache;
import com.english_hub.core.modules.user.infrastructure.security.AuthenticatedUserProvider;
import com.english_hub.core.modules.user.presentation.rest.AdminUserController;
import com.english_hub.core.modules.user.presentation.rest.UserController;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminUserController.class, UserController.class}, properties = {
		"app.security.jwt-secret=englishhub-fe71-test-secret-with-at-least-32-bytes",
		"app.security.jwt-issuer=englishhub-fe71-test",
		"app.security.access-token-ttl-seconds=900",
		"app.cache.enabled=true",
		"spring.cache.type=caffeine"
})
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtTokenService.class,
		ApiAuthenticationEntryPoint.class, ApiAccessDeniedHandler.class, GlobalExceptionHandler.class,
		AdminUserService.class, UserProfileService.class, AuthenticatedUserProvider.class,
		UserSnapshotCache.class, CacheConfig.class, AdminUserDetailWebIntegrationTest.JsonConfiguration.class})
@MockitoBean(types = UserRepository.class)
@MockitoSpyBean(types = AdminUserService.class)
class AdminUserDetailWebIntegrationTest {

	private static final String SECRET = "englishhub-fe71-test-secret-with-at-least-32-bytes";
	private static final String ISSUER = "englishhub-fe71-test";
	private static final String USERS_PATH = "/api/v1/admin/users";
	// Contract-test scalar only: the CSV snapshot does not contain actual student codes.
	private static final String MOCK_STUDENT_CODE = "mock-repository-student-code";
	private static final Set<String> ALLOWED_FIELDS = Set.of("id", "fullName", "email", "role", "status",
			"phone", "avatarUrl", "specialization", "studentCode", "dateOfBirth", "parentPhone");

	private final MockMvc mockMvc;
	private final JwtTokenService jwtTokenService;
	private final UserRepository userRepository;
	private final AdminUserService adminUserService;
	private final CacheManager cacheManager;
	private final ObjectMapper objectMapper;
	private final Map<Long, User> users = new HashMap<>();

	@Autowired
	AdminUserDetailWebIntegrationTest(MockMvc mockMvc, JwtTokenService jwtTokenService,
			UserRepository userRepository, AdminUserService adminUserService,
			CacheManager cacheManager, ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.jwtTokenService = jwtTokenService;
		this.userRepository = userRepository;
		this.adminUserService = adminUserService;
		this.cacheManager = cacheManager;
		this.objectMapper = objectMapper;
	}

	@BeforeEach
	void setUp() {
		assertThat(cacheManager.getCache(CacheConfig.USERS)).isInstanceOf(CaffeineCache.class);
		cacheManager.getCache(CacheConfig.USERS).clear();
		users.clear();
		users.put(1L, fixture(1L));
		users.put(4L, fixture(4L));
		users.put(12L, fixture(12L));
		users.put(13L, fixture(13L));
		when(userRepository.findById(anyLong())).thenAnswer(invocation ->
				Optional.ofNullable(users.get(invocation.getArgument(0, Long.class)))
						.filter(user -> !user.deleted()));
	}

	@ParameterizedTest
	@ValueSource(longs = {12L, 13L})
	void getUser_whenAdminRequestsStudent_returns200WithMatchingSnapshotIdentity(long id) throws Exception {
		JsonNode body = readDetail(id);

		assertStudentIdentity(body, id);
	}

	@Test
	void getUser_whenTwoStudentsAreRequested_returnsDistinctMatchingIdentities() throws Exception {
		JsonNode first = readDetail(12L);
		JsonNode second = readDetail(13L);

		assertStudentIdentity(first, 12L);
		assertStudentIdentity(second, 13L);
		assertThat(first.path("id").asLong()).isNotEqualTo(second.path("id").asLong());
		assertThat(first.path("email").asString()).isNotEqualTo(second.path("email").asString());
	}

	@ParameterizedTest
	@ValueSource(longs = {1L, 4L, 12L, 13L})
	void getUser_whenSerialized_containsOnlyAllowedDtoFieldsAndNoPasswordOrHash(long id) throws Exception {
		JsonNode body = readDetail(id);

		assertThat(body.isObject()).isTrue();
		for (Map.Entry<String, JsonNode> field : body.properties()) {
			assertThat(ALLOWED_FIELDS).contains(field.getKey());
		}
		assertNoSensitiveFields(body);
	}

	@Test
	void getUser_whenTokenIsMissing_returns401WithoutTargetLookup() throws Exception {
		mockMvc.perform(get(USERS_PATH + "/12")).andExpect(status().isUnauthorized());

		verifyNoInteractions(userRepository);
		verify(adminUserService, never()).getUser(anyLong());
	}

	@Test
	void getUser_whenTokenIsMalformed_returns401WithoutTargetLookup() throws Exception {
		assertRejectedToken("not-a-jwt");
	}

	@Test
	void getUser_whenSignatureIsInvalid_returns401WithoutTargetLookup() throws Exception {
		JwtTokenService otherSigner = new JwtTokenService(objectMapper,
				"englishhub-fe71-other-test-secret-with-32-bytes", ISSUER, 900L);

		assertRejectedToken(otherSigner.createAccessToken(1L, tokenRole(UserRole.ADMIN)));
	}

	@Test
	void getUser_whenTokenIsExpired_returns401WithoutTargetLookup() throws Exception {
		JwtTokenService expiredSigner = new JwtTokenService(objectMapper, SECRET, ISSUER, -1L);

		assertRejectedToken(expiredSigner.createAccessToken(1L, tokenRole(UserRole.ADMIN)));
	}

	@ParameterizedTest
	@ValueSource(longs = {4L, 13L})
	void getUser_whenCallerIsTeacherOrStudent_returns403WithoutTargetLookup(long callerId) throws Exception {
		mockMvc.perform(get(USERS_PATH + "/12").header(HttpHeaders.AUTHORIZATION, bearer(callerId)))
				.andExpect(status().isForbidden());

		verifyNoInteractions(userRepository);
		verify(adminUserService, never()).getUser(anyLong());
	}

	@Test
	void getUser_whenAdminIsLocked_returns401WithoutTargetLookup() throws Exception {
		users.get(1L).changeStatus(UserStatus.LOCKED);

		assertRejectedAdmin();
	}

	@Test
	void getUser_whenAdminIsSoftDeleted_returns401WithoutTargetLookup() throws Exception {
		User deleted = users.get(1L);
		deleted.softDelete();
		when(userRepository.findById(1L)).thenReturn(Optional.of(deleted));

		assertRejectedAdmin();
	}

	@Test
	void getUser_whenAdminNoLongerExists_returns401WithoutTargetLookup() throws Exception {
		users.remove(1L);

		assertRejectedAdmin();
	}

	@Test
	void getUser_whenTargetDoesNotExist_returns404WithExistingErrorFormat() throws Exception {
		assertTargetNotFound(Long.MAX_VALUE);
	}

	@Test
	void getUser_whenTargetIsSoftDeleted_returns404() throws Exception {
		users.get(12L).softDelete();

		assertTargetNotFound(12L);
	}

	@ParameterizedTest
	@ValueSource(longs = {0L, -1L})
	void getUser_whenIdIsNonpositive_returns404WithoutTargetLookup(long id) throws Exception {
		assertTargetNotFound(id);

		verify(userRepository, never()).findById(id);
	}

	@ParameterizedTest
	@ValueSource(strings = {"abc", "12.5", "9223372036854775808"})
	void getUser_whenIdCannotBindToLong_returns400WithoutCallingDetail(String id) throws Exception {
		mockMvc.perform(get(USERS_PATH + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isBadRequest())
				.andExpect(content().json("{\"error\":\"Dữ liệu không hợp lệ.\"}"));

		verify(adminUserService, never()).getUser(anyLong());
		verifyNoInteractions(userRepository);
	}

	@Test
	void getUser_whenTargetIsLocked_returns200WithLockedStatus() throws Exception {
		users.get(12L).changeStatus(UserStatus.LOCKED);

		JsonNode body = readDetail(12L);

		assertThat(body.path("id").asLong()).isEqualTo(12L);
		assertThat(body.path("email").asString()).isEqualTo(users.get(12L).email());
		assertThat(body.path("status").asString()).isEqualTo("LOCKED");
	}

	@Test
	void getUser_whenTargetIsTeacher_returnsSpecializationWithoutStudentFields() throws Exception {
		users.get(4L).updateTeacherProfile("mock-repository-specialization");

		JsonNode body = readDetail(4L);

		assertThat(body.path("id").asLong()).isEqualTo(4L);
		assertThat(body.path("email").asString()).isEqualTo(users.get(4L).email());
		assertThat(body.path("role").asString()).isEqualTo("TEACHER");
		assertThat(body.path("specialization").asString()).isEqualTo("mock-repository-specialization");
		assertThat(body.has("studentCode")).isFalse();
		assertThat(body.has("dateOfBirth")).isFalse();
		assertThat(body.has("parentPhone")).isFalse();
	}

	@Test
	void getUser_whenTargetIsAdmin_returns200WithAdminIdentity() throws Exception {
		JsonNode body = readDetail(1L);

		assertThat(body.path("id").asLong()).isEqualTo(1L);
		assertThat(body.path("email").asString()).isEqualTo(users.get(1L).email());
		assertThat(body.path("role").asString()).isEqualTo("ADMIN");
		assertThat(body.has("studentCode")).isFalse();
		assertThat(body.has("specialization")).isFalse();
	}

	@ParameterizedTest
	@ValueSource(longs = {4L, 12L})
	void getUser_whenProfileIsMissing_returns200WithoutProfileFields(long id) throws Exception {
		users.get(id).updateStudentProfile(null, null, null);

		JsonNode body = readDetail(id);

		assertThat(body.path("id").asLong()).isEqualTo(id);
		assertThat(body.path("fullName").asString()).isEqualTo(users.get(id).fullName());
		assertThat(body.path("email").asString()).isEqualTo(users.get(id).email());
		assertThat(body.path("role").asString()).isEqualTo(users.get(id).role().name());
		assertThat(body.has("specialization")).isFalse();
		assertThat(body.has("studentCode")).isFalse();
		assertThat(body.has("dateOfBirth")).isFalse();
		assertThat(body.has("parentPhone")).isFalse();
	}

	@Test
	void getUser_whenOptionalFieldsAreNull_omitsNullFieldsAndEnvelope() throws Exception {
		JsonNode body = readDetail(12L);

		Set<String> expectedFields = Set.of("id", "fullName", "email", "role", "status", "studentCode");
		assertThat(body.propertyNames()).containsExactlyInAnyOrderElementsOf(expectedFields);
		for (Map.Entry<String, JsonNode> field : body.properties()) {
			assertThat(field.getValue().isNull()).isFalse();
		}
		assertThat(body.has("data")).isFalse();
		assertThat(body.has("success")).isFalse();
	}

	@Test
	void getUser_whenReadingDetail_doesNotWriteOrChangeFixtureState() throws Exception {
		Map<Long, User> before = new HashMap<>();
		users.forEach((id, user) -> before.put(id, user.copy()));

		readDetail(12L);

		assertThat(users).usingRecursiveComparison().isEqualTo(before);
		verify(userRepository, never()).save(any(User.class));
		verify(userRepository, never()).deleteById(anyLong());
		verify(userRepository, never()).revokeActiveRefreshTokens(anyLong());
	}

	@Test
	void getUser_whenCalledTwice_returnsTheSameIdentity() throws Exception {
		JsonNode first = readDetail(12L);
		JsonNode second = readDetail(12L);

		assertStudentIdentity(first, 12L);
		assertThat(second).isEqualTo(first);
		verify(userRepository, times(2)).findById(12L);
	}

	@Test
	void getUser_whenIdsChangeWithAuthenticationCacheEnabled_doesNotMixIdentities() throws Exception {
		assertStudentIdentity(readDetail(12L), 12L);
		assertStudentIdentity(readDetail(13L), 13L);
		assertStudentIdentity(readDetail(12L), 12L);

		assertThat(cacheManager.getCache(CacheConfig.USERS).get(1L)).isNotNull();
		verify(userRepository, times(1)).findById(1L);
		verify(userRepository, times(2)).findById(12L);
		verify(userRepository, times(1)).findById(13L);
	}

	@ParameterizedTest
	@ValueSource(strings = {"/api/v1/admin/users/12/", "/api/v1/admin/users/12/abc"})
	void getUser_whenPathHasTrailingSlashOrExtraSegment_isNotAllowedByDetailRoute(String path)
			throws Exception {
		assertThat(ApiRoutePolicy.contains(new MockHttpServletRequest("GET", path))).isFalse();

		mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isForbidden());

		verify(adminUserService, never()).getUser(anyLong());
		verifyNoInteractions(userRepository);
	}

	@ParameterizedTest
	@CsvSource({"4,GET,", "4,POST,", "4,PUT,/12", "4,PATCH,/12/status", "4,DELETE,/12",
			"13,GET,", "13,POST,", "13,PUT,/12", "13,PATCH,/12/status", "13,DELETE,/12"})
	void existingAdminRoutes_whenCallerIsTeacherOrStudent_remainForbidden(
			long callerId, String method, String suffix) throws Exception {
		String path = USERS_PATH + (suffix == null ? "" : suffix);

		mockMvc.perform(request(HttpMethod.valueOf(method), path)
				.header(HttpHeaders.AUTHORIZATION, bearer(callerId)))
				.andExpect(status().isForbidden());

		verifyNoInteractions(userRepository);
	}

	@Test
	void listUsers_whenAdminCallsList_reachesListHandlerWithExistingResponse() throws Exception {
		when(userRepository.findPage(eq(""), isNull(), any(UserPageRequest.class)))
				.thenReturn(new UserPage(List.of(users.get(12L), users.get(13L)), 1, 20, 2));

		String response = mockMvc.perform(get(USERS_PATH).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

		JsonNode body = objectMapper.readTree(response);
		assertThat(body.path("data").size()).isEqualTo(2);
		assertThat(body.path("data").get(0).path("id").asLong()).isEqualTo(12L);
		assertThat(body.path("pagination").path("total").asLong()).isEqualTo(2L);
		verify(userRepository).findPage(eq(""), isNull(), any(UserPageRequest.class));
		verify(adminUserService, never()).getUser(anyLong());
	}

	@Test
	void createUser_whenAdminCallsPost_reachesCreateHandlerAndReturns201() throws Exception {
		User expected = users.get(12L);
		when(userRepository.save(any(User.class))).thenReturn(expected.copy());
		String payload = objectMapper.writeValueAsString(Map.of("fullName", expected.fullName(),
				"email", expected.email(), "role", "STUDENT", "password", "Password123!"));

		String response = mockMvc.perform(post(USERS_PATH).header(HttpHeaders.AUTHORIZATION, bearer(1L))
				.contentType(MediaType.APPLICATION_JSON).content(payload))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();

		JsonNode body = objectMapper.readTree(response);
		assertThat(body.path("user").path("id").asLong()).isEqualTo(12L);
		assertThat(body.path("user").path("email").asString()).isEqualTo(expected.email());
		assertThat(body.path("message").asString()).isEqualTo("Tạo tài khoản thành công.");
		verify(userRepository).save(any(User.class));
		verify(adminUserService, never()).getUser(anyLong());
	}

	@Test
	void updateUser_whenAdminCallsPut_reachesUpdateHandlerAndReturnsExistingMessage() throws Exception {
		String requestedName = users.get(13L).fullName();
		String payload = objectMapper.writeValueAsString(Map.of("fullName", requestedName));

		mockMvc.perform(put(USERS_PATH + "/12").header(HttpHeaders.AUTHORIZATION, bearer(1L))
				.contentType(MediaType.APPLICATION_JSON).content(payload))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"message\":\"Cập nhật người dùng thành công.\"}"));

		verify(adminUserService).updateUser(eq(12L), any(UpdateUserCommand.class));
		verify(userRepository).save(users.get(12L));
		assertThat(users.get(12L).fullName()).isEqualTo(requestedName);
		verify(adminUserService, never()).getUser(anyLong());
	}

	@ParameterizedTest
	@ValueSource(strings = {"LOCKED", "ACTIVE"})
	void updateStatus_whenAdminCallsPatch_reachesStatusHandlerAndPreservesMessage(String requestedStatus)
			throws Exception {
		String message = requestedStatus.equals("LOCKED") ? "Đã khoá tài khoản." : "Đã mở khoá tài khoản.";
		String payload = objectMapper.writeValueAsString(Map.of("status", requestedStatus));

		mockMvc.perform(patch(USERS_PATH + "/12/status").header(HttpHeaders.AUTHORIZATION, bearer(1L))
				.contentType(MediaType.APPLICATION_JSON).content(payload))
				.andExpect(status().isOk())
				.andExpect(content().json(objectMapper.writeValueAsString(Map.of("message", message))));

		assertThat(users.get(12L).status().name()).isEqualTo(requestedStatus);
		verify(userRepository).save(users.get(12L));
		verify(userRepository, times(requestedStatus.equals("LOCKED") ? 1 : 0)).revokeActiveRefreshTokens(12L);
		verify(adminUserService, never()).getUser(anyLong());
	}

	@Test
	void deleteUser_whenAdminCallsDelete_reachesDeleteHandlerAndReturnsExistingMessage() throws Exception {
		mockMvc.perform(delete(USERS_PATH + "/12").header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isOk())
				.andExpect(content().json("{\"message\":\"Đã xoá người dùng.\"}"));

		verify(userRepository).deleteById(12L);
		verify(adminUserService, never()).getUser(anyLong());
	}

	@ParameterizedTest
	@ValueSource(longs = {1L, 4L, 13L})
	void getMyProfile_whenAnyAllowedRoleCallsMe_returnsTheCallerProfile(long callerId) throws Exception {
		String response = mockMvc.perform(get("/api/v1/users/me")
				.header(HttpHeaders.AUTHORIZATION, bearer(callerId)))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

		JsonNode body = objectMapper.readTree(response);
		assertThat(body.path("id").asLong()).isEqualTo(callerId);
		assertThat(body.path("email").asString()).isEqualTo(users.get(callerId).email());
		verify(adminUserService, never()).getUser(anyLong());
	}

	private JsonNode readDetail(long id) throws Exception {
		String response = mockMvc.perform(get(USERS_PATH + "/" + id)
				.header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return objectMapper.readTree(response);
	}

	private void assertStudentIdentity(JsonNode body, long id) {
		User expected = users.get(id);
		assertThat(body.path("id").isIntegralNumber()).isTrue();
		assertThat(body.path("id").asLong()).isEqualTo(id);
		assertThat(body.path("email").asString()).isEqualTo(expected.email());
		assertThat(body.path("fullName").asString()).isEqualTo(expected.fullName());
		assertThat(body.path("role").asString()).isEqualTo("STUDENT");
		assertThat(body.path("status").asString()).isEqualTo("ACTIVE");
		assertThat(body.path("studentCode").asString()).isNotBlank().isEqualTo(MOCK_STUDENT_CODE);
	}

	private void assertNoSensitiveFields(JsonNode node) {
		if (node.isObject()) {
			for (Map.Entry<String, JsonNode> field : node.properties()) {
				assertThat(field.getKey().toLowerCase(Locale.ROOT)).doesNotContain("password", "hash");
				assertNoSensitiveFields(field.getValue());
			}
		} else if (node.isArray()) {
			for (JsonNode child : node) {
				assertNoSensitiveFields(child);
			}
		}
	}

	private void assertRejectedToken(String token) throws Exception {
		mockMvc.perform(get(USERS_PATH + "/12").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized());
		verifyNoInteractions(userRepository);
		verify(adminUserService, never()).getUser(anyLong());
	}

	private void assertRejectedAdmin() throws Exception {
		String token = jwtTokenService.createAccessToken(1L, tokenRole(UserRole.ADMIN));
		mockMvc.perform(get(USERS_PATH + "/12").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
				.andExpect(status().isUnauthorized());
		verify(userRepository, never()).findById(12L);
	}

	private void assertTargetNotFound(long id) throws Exception {
		mockMvc.perform(get(USERS_PATH + "/" + id).header(HttpHeaders.AUTHORIZATION, bearer(1L)))
				.andExpect(status().isNotFound())
				.andExpect(content().json("{\"error\":\"Không tìm thấy người dùng.\"}"));
	}

	private String bearer(long callerId) {
		return "Bearer " + jwtTokenService.createAccessToken(callerId, tokenRole(users.get(callerId).role()));
	}

	private com.english_hub.core.modules.user.domain.model.UserRole tokenRole(UserRole role) {
		return com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
	}

	private User fixture(long id) {
		return switch ((int) id) {
			case 1 -> new User(id, "Hoàng Thanh Ngân", "hoang.thanh.ngan@utc-polyglot.edu.vn", null, null,
					"test-password-hash", UserRole.ADMIN, UserStatus.ACTIVE, false, null, null, null, null);
			case 4 -> new User(id, "Phạm Diệu Anh", "pham.dieu.anh@gmail.com", null, null,
					"test-password-hash", UserRole.TEACHER, UserStatus.ACTIVE, false, null, null, null, null);
			case 12 -> new User(id, "Ngô Thị Phương", "ngo.thi.phuong@gmail.com", null, null,
					"test-password-hash", UserRole.STUDENT, UserStatus.ACTIVE, false, null, MOCK_STUDENT_CODE, null, null);
			case 13 -> new User(id, "Lý Đức Việt", "ly.duc.viet@gmail.com", null, null,
					"test-password-hash", UserRole.STUDENT, UserStatus.ACTIVE, false, null, MOCK_STUDENT_CODE, null, null);
			default -> throw new IllegalArgumentException("No snapshot fixture for ID " + id);
		};
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
