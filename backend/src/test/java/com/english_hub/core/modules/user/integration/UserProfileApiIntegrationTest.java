package com.english_hub.core.modules.user.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(properties = {
		"spring.jpa.hibernate.ddl-auto=validate",
		"spring.flyway.enabled=true",
		"spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
		"spring.jpa.properties.hibernate.cache.use_query_cache=false",
		"app.cache.enabled=false",
		"spring.cache.type=none"
})
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@Transactional
class UserProfileApiIntegrationTest {

	private static final String PASSWORD_PATH = "/api/v1/users/me/password";
	private static final String ORIGINAL_PASSWORD = "Current05Password";
	private static final String CHANGED_PASSWORD = "Different05Password";
	private static final String REQUIRED_PASSWORD_ERROR =
			"Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.";
	private static final String SAME_PASSWORD_ERROR =
			"Mật khẩu mới không được trùng với mật khẩu hiện tại.";
	private static final String WRONG_CURRENT_PASSWORD_ERROR = "Mật khẩu hiện tại không chính xác.";
	private static final String PASSWORD_BYTE_LIMIT_ERROR = "Mật khẩu mới không được vượt quá 72 byte UTF-8.";
	private static final String PASSWORD_72_ASCII = "A1" + "a".repeat(70);
	private static final String PASSWORD_73_ASCII = "A1" + "a".repeat(71);
	private static final String PASSWORD_73_WITH_VIETNAMESE = "A1" + "a".repeat(69) + "á";
	private static final String PASSWORD_72_WITH_VIETNAMESE = "A1" + "a".repeat(68) + "á";

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_user_profile_api_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final MockMvc mockMvc;
	private final ObjectMapper objectMapper;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final JwtTokenService jwtTokenService;
	private final PasswordEncoder passwordEncoder;
	private final EntityManager entityManager;
	private Account adminAccount;

	UserProfileApiIntegrationTest(
			MockMvc mockMvc,
			ObjectMapper objectMapper,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			JwtTokenService jwtTokenService,
			PasswordEncoder passwordEncoder,
			EntityManager entityManager) {
		this.mockMvc = mockMvc;
		this.objectMapper = objectMapper;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.jwtTokenService = jwtTokenService;
		this.passwordEncoder = passwordEncoder;
		this.entityManager = entityManager;
	}

	@BeforeEach
	void setUp() {
		adminAccount = createAccount(UserRole.ADMIN);
	}

	@AfterEach
	void clearSecurityContext() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void rejectsTheCurrentPasswordAsTheNewPasswordWithoutChangingTheStoredHash() throws Exception {
		assertFailureAndUnchangedHash(
				adminAccount,
				bearer(adminAccount),
				passwordBody(ORIGINAL_PASSWORD, ORIGINAL_PASSWORD),
				400,
				SAME_PASSWORD_ERROR);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("incompletePasswordBodies")
	void rejectsMissingEmptyOrNullPasswordFields(
			String caseId,
			String body) throws Exception {
		assertFailureAndUnchangedHash(adminAccount, bearer(adminAccount), body, 400, REQUIRED_PASSWORD_ERROR);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("allowedRoles")
	void changesAndRestoresPasswordForEveryAllowedRole(String caseId, UserRole role) throws Exception {
		Account account = createAccount(role);
		try {
			MvcResult response = changePassword(
					bearer(account), passwordBody(ORIGINAL_PASSWORD, CHANGED_PASSWORD));
			JsonNode responseBody = objectMapper.readTree(response.getResponse().getContentAsString());
			assertThat(response.getResponse().getStatus()).isEqualTo(200);
			assertThat(responseBody.size()).isEqualTo(1);
			assertThat(responseBody.path("message").asText()).isEqualTo("Đổi mật khẩu thành công.");
			assertThat(passwordEncoder.matches(CHANGED_PASSWORD, readPasswordHash(account.userId()))).isTrue();
		} finally {
			restoreOriginalPassword(account, CHANGED_PASSWORD);
		}
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("differentPasswordVariants")
	void acceptsCaseOnlyAndTrailingSpacePasswordVariantsAndRestoresThem(
			String caseId,
			String newPassword) throws Exception {
		String originalHash = readPasswordHash(adminAccount.userId());
		try {
			MvcResult response = changePassword(
					bearer(adminAccount), passwordBody(ORIGINAL_PASSWORD, newPassword));
			JsonNode responseBody = objectMapper.readTree(response.getResponse().getContentAsString());
			String updatedHash = readPasswordHash(adminAccount.userId());

			assertThat(response.getResponse().getStatus()).isEqualTo(200);
			assertThat(responseBody.size()).isEqualTo(1);
			assertThat(responseBody.path("message").asText()).isEqualTo("Đổi mật khẩu thành công.");
			assertThat(updatedHash).isNotEqualTo(originalHash);
			assertThat(passwordEncoder.matches(newPassword, updatedHash)).isTrue();
			assertThat(passwordEncoder.matches(ORIGINAL_PASSWORD, updatedHash)).isFalse();
		} finally {
			restoreOriginalPassword(adminAccount, newPassword);
		}
	}

	@Test
	void incorrectCurrentPasswordTakesPriorityWhenNewPasswordMatchesTheCurrentPassword() throws Exception {
		assertFailureAndUnchangedHash(
				adminAccount,
				bearer(adminAccount),
				passwordBody("Wrong05Password", ORIGINAL_PASSWORD),
				401,
				WRONG_CURRENT_PASSWORD_ERROR);
	}

	@Test
	@DisplayName("ED-406-03")
	void rejectsIncorrectCurrentPasswordLongerThan72BytesWithoutChangingHash() throws Exception {
		assertThat(PASSWORD_73_ASCII.getBytes(StandardCharsets.UTF_8)).hasSize(73);
		assertFailureAndUnchangedHash(
				adminAccount,
				bearer(adminAccount),
				passwordBody(PASSWORD_73_ASCII, ORIGINAL_PASSWORD),
				401,
				WRONG_CURRENT_PASSWORD_ERROR);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("passwordsAt72Bytes")
	void acceptsValidPasswordsAt72Utf8BytesAndRestoresOriginal(
			String caseId,
			String newPassword) throws Exception {
		String originalHash = readPasswordHash(adminAccount.userId());
		try {
			MvcResult response = changePassword(bearer(adminAccount), passwordBody(ORIGINAL_PASSWORD, newPassword));
			JsonNode responseBody = objectMapper.readTree(response.getResponse().getContentAsString());
			String updatedHash = readPasswordHash(adminAccount.userId());

			assertThat(response.getResponse().getStatus()).isEqualTo(200);
			assertThat(responseBody.size()).isEqualTo(1);
			assertThat(responseBody.path("message").asText()).isEqualTo("Đổi mật khẩu thành công.");
			assertThat(updatedHash).isNotEqualTo(originalHash);
			assertThat(passwordEncoder.matches(newPassword, updatedHash)).isTrue();
			assertThat(passwordEncoder.matches(ORIGINAL_PASSWORD, updatedHash)).isFalse();
		} finally {
			restoreOriginalPassword(adminAccount, newPassword);
		}
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("passwordsAbove72Bytes")
	void rejectsPasswordsAbove72Utf8BytesWithoutChangingHash(
			String caseId,
			String newPassword) throws Exception {
		assertFailureAndUnchangedHash(
				adminAccount,
				bearer(adminAccount),
				passwordBody(ORIGINAL_PASSWORD, newPassword),
				400,
				PASSWORD_BYTE_LIMIT_ERROR);
	}

	@Test
	@DisplayName("ED-406-08")
	void rejectsOverlongPasswordBeforeCheckingWhetherItMatchesCurrentPassword() throws Exception {
		String originalHash = readPasswordHash(adminAccount.userId());
		String currentPassword72Bytes = PASSWORD_72_ASCII;
		String overlongPasswordWithSame72BytePrefix = currentPassword72Bytes + "a";
		assertThat(currentPassword72Bytes.getBytes(StandardCharsets.UTF_8)).hasSize(72);
		assertThat(overlongPasswordWithSame72BytePrefix.getBytes(StandardCharsets.UTF_8)).hasSize(73);

		try {
			replacePasswordHash(adminAccount, passwordEncoder.encode(currentPassword72Bytes));
			assertFailureAndUnchangedHash(
					adminAccount,
					bearer(adminAccount),
					passwordBody(currentPassword72Bytes, overlongPasswordWithSame72BytePrefix),
					400,
					PASSWORD_BYTE_LIMIT_ERROR);
		} finally {
			replacePasswordHash(adminAccount, originalHash);
		}
		assertThat(readPasswordHash(adminAccount.userId())).isEqualTo(originalHash);
	}

	@Test
	void passwordChangeRequiresAuthenticationAndDoesNotChangeTheStoredHash() throws Exception {
		assertFailureAndUnchangedHash(
				adminAccount,
				null,
				passwordBody(ORIGINAL_PASSWORD, CHANGED_PASSWORD),
				401,
				null);
	}

	private static Stream<Arguments> incompletePasswordBodies() {
		return Stream.of(
				Arguments.of("ED-406-EMPTY-NEW", passwordBody(ORIGINAL_PASSWORD, "")),
				Arguments.of("ED-406-NULL-NEW", "{\"currentPassword\":\"Current05Password\",\"newPassword\":null}"),
				Arguments.of("ED-406-MISSING-NEW", "{\"currentPassword\":\"Current05Password\"}"),
				Arguments.of("ED-406-02-current-empty", passwordBody("", ORIGINAL_PASSWORD)),
				Arguments.of("ED-406-02-current-null", "{\"currentPassword\":null,\"newPassword\":\"Current05Password\"}"),
				Arguments.of("ED-406-02-current-missing", "{\"newPassword\":\"Current05Password\"}"));
	}

	private static Stream<Arguments> allowedRoles() {
		return Stream.of(
				Arguments.of("ADMIN", UserRole.ADMIN),
				Arguments.of("TEACHER", UserRole.TEACHER),
				Arguments.of("STUDENT", UserRole.STUDENT));
	}

	private static Stream<Arguments> differentPasswordVariants() {
		return Stream.of(
				Arguments.of("ED-406-CASE-ONLY", "current05Password"),
				Arguments.of("ED-406-TRAILING-SPACE", "Current05Password "));
	}

	private static Stream<Arguments> passwordsAt72Bytes() {
		return Stream.of(
				Arguments.of("ED-406-04", PASSWORD_72_ASCII),
				Arguments.of("ED-406-07", PASSWORD_72_WITH_VIETNAMESE));
	}

	private static Stream<Arguments> passwordsAbove72Bytes() {
		return Stream.of(
				Arguments.of("ED-406-05", PASSWORD_73_ASCII),
				Arguments.of("ED-406-06", PASSWORD_73_WITH_VIETNAMESE));
	}

	private Account createAccount(UserRole role) {
		String suffix = UUID.randomUUID().toString().replace("-", "");
		String email = "be91-" + suffix + "@example.test";
		String passwordHash = passwordEncoder.encode(ORIGINAL_PASSWORD);
		User user = userRepository.saveAndFlush(new User(
				"BE-91 " + role.name(), email, null, passwordHash, role, UserStatus.ACTIVE, false));

		if (role == UserRole.TEACHER) {
			teacherProfileRepository.saveAndFlush(new TeacherProfile(user, "Integration test"));
		}
		if (role == UserRole.STUDENT) {
			studentProfileRepository.saveAndFlush(new StudentProfile(
					user, "BE91-" + suffix.substring(0, 12), null, null));
		}

		return new Account(user.getId(), role);
	}

	private String bearer(Account account) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(account.role().name());
		return "Bearer " + jwtTokenService.createAccessToken(account.userId(), tokenRole);
	}

	private MvcResult changePassword(String authorization, String body) throws Exception {
		var request = patch(PASSWORD_PATH)
				.contentType(MediaType.APPLICATION_JSON)
				.content(body);
		if (authorization != null) {
			request.header(HttpHeaders.AUTHORIZATION, authorization);
		}
		return mockMvc.perform(request).andReturn();
	}

	private void assertFailureAndUnchangedHash(
			Account account,
			String authorization,
			String body,
			int expectedStatus,
			String expectedError) throws Exception {
		String hashBefore = readPasswordHash(account.userId());
		MvcResult response = changePassword(authorization, body);
		String hashAfter = readPasswordHash(account.userId());
		JsonNode responseBody = objectMapper.readTree(response.getResponse().getContentAsString());

		assertThat(response.getResponse().getStatus()).isEqualTo(expectedStatus);
		assertThat(responseBody.size()).isEqualTo(1);
		assertThat(responseBody.has("error")).isTrue();
		assertThat(responseBody.path("error").asText()).isNotBlank();
		if (expectedError != null) {
			assertThat(responseBody.path("error").asText()).isEqualTo(expectedError);
		}
		assertThat(hashAfter).as("Rejected requests must leave the stored password hash unchanged")
				.isEqualTo(hashBefore);
	}

	private void restoreOriginalPassword(Account account, String changedPassword) throws Exception {
		String currentHash = readPasswordHash(account.userId());
		if (passwordEncoder.matches(changedPassword, currentHash)) {
			MvcResult response = changePassword(
					bearer(account), passwordBody(changedPassword, ORIGINAL_PASSWORD));
			assertThat(response.getResponse().getStatus()).isEqualTo(200);
		}
		assertThat(passwordEncoder.matches(ORIGINAL_PASSWORD, readPasswordHash(account.userId()))).isTrue();
		assertThat(passwordEncoder.matches(changedPassword, readPasswordHash(account.userId()))).isFalse();
	}

	private void replacePasswordHash(Account account, String passwordHash) {
		User user = userRepository.findById(account.userId()).orElseThrow();
		user.updateFrom(
				user.getFullName(),
				user.getEmail(),
				user.getPhone(),
				user.getAvatarUrl(),
				passwordHash,
				user.getRole(),
				user.getStatus(),
				user.isDeleted());
		userRepository.saveAndFlush(user);
	}

	private String readPasswordHash(long userId) {
		entityManager.flush();
		entityManager.clear();
		return userRepository.findById(userId).orElseThrow().getPasswordHash();
	}

	private static String passwordBody(String currentPassword, String newPassword) {
		return "{\"currentPassword\":" + jsonValue(currentPassword)
				+ ",\"newPassword\":" + jsonValue(newPassword) + "}";
	}

	private static String jsonValue(String value) {
		return value == null ? "null" : "\"" + value + "\"";
	}

	private record Account(long userId, UserRole role) {
	}
}
