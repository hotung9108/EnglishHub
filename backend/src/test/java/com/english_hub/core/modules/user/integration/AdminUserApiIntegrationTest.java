package com.english_hub.core.modules.user.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.common.ApiException;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.auth.presentation.rest.dto.LoginRequest;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.modules.user.presentation.rest.dto.CreateUserRequest;
import com.english_hub.core.modules.user.application.dto.UserDto;
import com.english_hub.core.modules.user.application.service.UserCrudService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@Import(AdminUserApiIntegrationTest.SqlInspectionConfiguration.class)
class AdminUserApiIntegrationTest {

	private static final String ADMIN_USERS_PATH = "/api/v1/admin/users";
	private static final String LOGIN_PATH = "/api/v1/auth/login";
	private static final String ADMIN_FULL_NAME = "Hoàng Thanh Ngân";
	private static final String ADMIN_EMAIL = "hoang.thanh.ngan@utc-polyglot.edu.vn";
	private static final String ORIGINAL_PHONE = "0900000000";
	private static final String ORIGINAL_AVATAR = "https://example.test/old-avatar.png";
	private static final String NEW_FULL_NAME = "Trần Thị Mai Lan";
	private static final String NEW_AVATAR = "https://example.test/new-avatar.png";
	private static final String PHONE_ERROR = "Số điện thoại không được vượt quá 20 ký tự.";
	private static final SqlUpdateInspector SQL_UPDATES = new SqlUpdateInspector();

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_admin_user_api_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final MockMvc mockMvc;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final PasswordEncoder passwordEncoder;
	private final ObjectMapper objectMapper;
	private final JdbcTemplate jdbc;
	private final UserCrudService crudService;
	private String accessToken;
	private long callerId;

	AdminUserApiIntegrationTest(
			MockMvc mockMvc,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			PasswordEncoder passwordEncoder,
			ObjectMapper objectMapper,
			JdbcTemplate jdbc,
			UserCrudService crudService) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.passwordEncoder = passwordEncoder;
		this.objectMapper = objectMapper;
		this.jdbc = jdbc;
		this.crudService = crudService;
	}

	@BeforeEach
	void setUp() throws Exception {
		String email = uniqueEmail("caller");
		String password = newTestPassword();
		User caller = new User(ADMIN_FULL_NAME, email, ORIGINAL_PHONE, passwordEncoder.encode(password),
				UserRole.ADMIN, UserStatus.ACTIVE, false);
		caller.updateFrom(caller.getFullName(), caller.getEmail(), ORIGINAL_PHONE, ORIGINAL_AVATAR,
				caller.getPasswordHash(), caller.getRole(), caller.getStatus(), false);
		callerId = userRepository.saveAndFlush(caller).getId();
		accessToken = login(email, password);
	}

	@Test
	void postgresContainerHasMigratedAndValidatedTheExistingPhoneColumn() {
		assertThat(jdbc.queryForObject("select current_database()", String.class)).isEqualTo(POSTGRES.getDatabaseName());
		assertThat(jdbc.queryForObject("show server_version", String.class)).startsWith("16.");
		assertThat(jdbc.queryForObject("show server_encoding", String.class)).isEqualTo("UTF8");
		assertThat(jdbc.queryForList("select version from flyway_schema_history where success and version is not null order by installed_rank",
				String.class)).containsExactly("1", "2", "3", "4", "5");
		assertThat(jdbc.queryForObject("select count(*) from flyway_schema_history where not success", Long.class)).isZero();
		assertThat(jdbc.queryForObject("select character_maximum_length from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'phone'",
				Integer.class)).isEqualTo(20);
	}

	@ParameterizedTest(name = "ownProfile={0}, {1}")
	@MethodSource("httpPhoneCases")
	void phoneBoundaryContractThroughRealHttpAndPostgres(boolean ownProfile, String scenario,
			String phone, int expectedStatus, String expectedPhone) throws Exception {
		Map<String, Object> before = databaseState();
		PhoneUpdate update = updatePhone(ownProfile, phoneBody(phone));

		if (expectedStatus == 400) {
			assertPhoneError(update.response(), PHONE_ERROR);
			assertThat(update.updates()).as("No SQL UPDATE may be prepared for rejected phone").isZero();
			assertThat(databaseState()).as("No partial update may be committed").isEqualTo(before);
			assertProfileReadback(ORIGINAL_PHONE, ADMIN_FULL_NAME, ORIGINAL_AVATAR);
		} else {
			assertThat(update.response().getResponse().getStatus()).isEqualTo(200);
			assertThat(update.updates()).as("Positive control: the inspector must see a real changed-row UPDATE").isPositive();
			assertStoredProfile(expectedPhone, ADMIN_FULL_NAME, ORIGINAL_AVATAR);
		}
	}

	@ParameterizedTest(name = "ownProfile={0}, explicitNull={1}, otherField={2}")
	@MethodSource("nullableRequests")
	void missingAndExplicitNullPhonePreserveExistingData(boolean ownProfile, boolean explicitNull,
			boolean otherField) throws Exception {
		Map<String, Object> body = new LinkedHashMap<>();
		if (explicitNull) {
			body.put("phone", null);
		}
		if (otherField) {
			body.put("fullName", NEW_FULL_NAME);
		}
		Map<String, Object> before = databaseState();
		PhoneUpdate update = updatePhone(ownProfile, body);

		if (otherField) {
			assertThat(update.response().getResponse().getStatus()).isEqualTo(200);
			assertThat(update.updates()).isPositive();
			assertStoredProfile(ORIGINAL_PHONE, NEW_FULL_NAME, ORIGINAL_AVATAR);
		} else {
			assertPhoneError(update.response(), "Không có dữ liệu để cập nhật.");
			assertThat(update.updates()).isZero();
			assertThat(databaseState()).isEqualTo(before);
			assertProfileReadback(ORIGINAL_PHONE, ADMIN_FULL_NAME, ORIGINAL_AVATAR);
		}
	}

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void rejectedMultiFieldRequestDoesNotCommitAndNextRequestRecovers(boolean ownProfile) throws Exception {
		Map<String, Object> before = databaseState();
		Map<String, Object> body = phoneBody("1".repeat(21));
		body.put("fullName", NEW_FULL_NAME);
		if (ownProfile) {
			body.put("avatarUrl", NEW_AVATAR);
		}

		PhoneUpdate rejected = updatePhone(ownProfile, body);

		assertPhoneError(rejected.response(), PHONE_ERROR);
		assertThat(rejected.updates()).isZero();
		assertThat(databaseState()).isEqualTo(before);
		assertProfileReadback(ORIGINAL_PHONE, ADMIN_FULL_NAME, ORIGINAL_AVATAR);

		body.put("phone", "1".repeat(20));
		PhoneUpdate recovered = updatePhone(ownProfile, body);

		assertThat(recovered.response().getResponse().getStatus()).isEqualTo(200);
		assertThat(recovered.updates()).isPositive();
		assertStoredProfile("1".repeat(20), NEW_FULL_NAME, ownProfile ? NEW_AVATAR : ORIGINAL_AVATAR);
	}

	@Test
	void successiveUpdatesAndUtf16BoundariesRoundTripWithoutTruncation() throws Exception {
		for (String phone : List.of("1".repeat(19), "Đ".repeat(20), "😀".repeat(10))) {
			PhoneUpdate update = updatePhone(true, phoneBody(phone));
			assertThat(update.response().getResponse().getStatus()).isEqualTo(200);
			assertThat(update.updates()).isPositive();
			assertStoredProfile(phone, ADMIN_FULL_NAME, ORIGINAL_AVATAR);
		}
		Map<String, Object> before = databaseState();
		PhoneUpdate rejected = updatePhone(true, phoneBody("😀".repeat(11)));
		assertPhoneError(rejected.response(), PHONE_ERROR);
		assertThat(rejected.updates()).isZero();
		assertThat(databaseState()).isEqualTo(before);
	}

	@ParameterizedTest(name = "CRUD: {0}")
	@MethodSource("phoneCases")
	void crudBeanUsesTheSamePhoneInvariantAndRealTransactions(String scenario, String phone,
			int expectedStatus, String expectedPhone) throws Exception {
		UserDto request = new UserDto();
		request.setPhone(phone);
		Map<String, Object> before = databaseState();
		int updates;
		SQL_UPDATES.begin();
		try {
			if (expectedStatus == 400) {
				assertCrudPhoneError(request, PHONE_ERROR);
			} else {
				assertThat(crudService.update(callerId, request).getPhone()).isEqualTo(expectedPhone);
			}
		} finally {
			updates = SQL_UPDATES.finish();
		}
		if (expectedStatus == 400) {
			assertThat(updates).isZero();
			assertThat(databaseState()).isEqualTo(before);
		} else {
			assertThat(updates).isPositive();
			assertStoredProfile(expectedPhone, ADMIN_FULL_NAME, ORIGINAL_AVATAR);
		}
	}

	@Test
	void crudRejectionRollsBackAllFieldsAndAllowsTheNextUpdate() throws Exception {
		UserDto request = new UserDto();
		request.setFullName(NEW_FULL_NAME);
		request.setAvatarUrl(NEW_AVATAR);
		request.setPhone("1".repeat(21));
		Map<String, Object> before = databaseState();
		int updates;
		SQL_UPDATES.begin();
		try {
			assertCrudPhoneError(request, PHONE_ERROR);
		} finally {
			updates = SQL_UPDATES.finish();
		}
		assertThat(updates).isZero();
		assertThat(databaseState()).isEqualTo(before);
		assertProfileReadback(ORIGINAL_PHONE, ADMIN_FULL_NAME, ORIGINAL_AVATAR);

		request.setPhone("1".repeat(20));
		crudService.update(callerId, request);
		assertStoredProfile("1".repeat(20), NEW_FULL_NAME, NEW_AVATAR);
	}

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void crudMissingOrNullPhoneKeepsTheOldPhone(boolean explicitNull) throws Exception {
		UserDto request = new UserDto();
		request.setFullName(NEW_FULL_NAME);
		if (explicitNull) {
			request.setPhone(null);
		}
		crudService.update(callerId, request);
		assertStoredProfile(ORIGINAL_PHONE, NEW_FULL_NAME, ORIGINAL_AVATAR);
	}

	@Test
	void crudNullPhoneAloneDoesNotCommitAnyChanges() {
		Map<String, Object> before = databaseState();
		UserDto request = new UserDto();
		request.setPhone(null);
		int updates;
		SQL_UPDATES.begin();
		try {
			assertCrudPhoneError(request, "Không có dữ liệu để cập nhật.");
		} finally {
			updates = SQL_UPDATES.finish();
		}
		assertThat(updates).isZero();
		assertThat(databaseState()).isEqualTo(before);
	}

	private static Stream<Arguments> phoneCases() {
		String boundary = "1".repeat(20);
		return Stream.of(Arguments.of("20 characters", boundary, 200, boundary),
				Arguments.of("leading space", " " + boundary, 200, boundary),
				Arguments.of("trailing space", boundary + " ", 200, boundary),
				Arguments.of("both edges", " " + boundary + " ", 200, boundary),
				Arguments.of("clear", "", 200, null), Arguments.of("blank", "   ", 200, null),
				Arguments.of("21 characters", "1".repeat(21), 400, null));
	}

	private static Stream<Arguments> httpPhoneCases() {
		return Stream.of(true, false).flatMap(own -> phoneCases().map(row -> {
			Object[] values = row.get();
			return Arguments.of(own, values[0], values[1], values[2], values[3]);
		}));
	}

	private static Stream<Arguments> nullableRequests() {
		return Stream.of(true, false).flatMap(own -> Stream.of(true, false).flatMap(explicitNull ->
				Stream.of(true, false).map(other -> Arguments.of(own, explicitNull, other))));
	}

	private Map<String, Object> phoneBody(String phone) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("phone", phone);
		return body;
	}

	private PhoneUpdate updatePhone(boolean ownProfile, Map<String, Object> body) throws Exception {
		String path = ownProfile ? "/api/v1/users/me" : ADMIN_USERS_PATH + "/" + callerId;
		int updates;
		MvcResult response;
		SQL_UPDATES.begin();
		try {
			response = mockMvc.perform(put(path).header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
					.contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body)))
					.andReturn();
		} finally {
			updates = SQL_UPDATES.finish();
		}
		return new PhoneUpdate(response, updates);
	}

	private void assertPhoneError(MvcResult response, String message) throws Exception {
		assertThat(response.getResponse().getStatus()).isEqualTo(400);
		assertThat(MediaType.parseMediaType(response.getResponse().getContentType())
				.isCompatibleWith(MediaType.APPLICATION_JSON)).isTrue();
		JsonNode json = objectMapper.readTree(response.getResponse().getContentAsString());
		assertThat(json.isObject()).isTrue();
		assertThat(json.size()).isEqualTo(1);
		assertThat(json.path("error").asText()).isEqualTo(message);
	}

	private void assertCrudPhoneError(UserDto request, String message) {
		assertThatThrownBy(() -> crudService.update(callerId, request))
				.isInstanceOfSatisfying(ApiException.class, exception ->
						assertThat(exception.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
				.hasMessage(message);
	}

	private Map<String, Object> databaseState() {
		return jdbc.queryForMap("select phone, full_name, avatar_url, updated_at from users where id = ?", callerId);
	}

	private void assertStoredProfile(String phone, String fullName, String avatar) throws Exception {
		Map<String, Object> row = databaseState();
		assertThat(row.get("phone")).isEqualTo(phone);
		assertThat(row.get("full_name")).isEqualTo(fullName);
		assertThat(row.get("avatar_url")).isEqualTo(avatar);
		assertProfileReadback(phone, fullName, avatar);
	}

	private void assertProfileReadback(String phone, String fullName, String avatar) throws Exception {
		MvcResult response = mockMvc.perform(get("/api/v1/users/me")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)).andExpect(status().isOk()).andReturn();
		JsonNode profile = objectMapper.readTree(response.getResponse().getContentAsString());
		assertThat(profile.path("id").asLong()).isEqualTo(callerId);
		assertThat(profile.path("fullName").asText()).isEqualTo(fullName);
		assertThat(profile.path("avatarUrl").asText()).isEqualTo(avatar);
		if (phone == null) {
			assertThat(profile.has("phone")).isFalse();
		} else {
			assertThat(profile.path("phone").asText()).isEqualTo(phone);
		}
	}

	private record PhoneUpdate(MvcResult response, int updates) {
	}

	/** Counts statements only; never retains SQL text or parameter values. */
	static class SqlUpdateInspector implements StatementInspector {
		private static final Pattern UPDATE = Pattern.compile("(?is)^\\s*(?:/\\*.*?\\*/\\s*)*update\\b");
		private final ThreadLocal<Integer> updates = new ThreadLocal<>();

		void begin() {
			if (updates.get() != null) {
				throw new IllegalStateException("Nested SQL capture is not allowed");
			}
			updates.set(0);
		}

		int finish() {
			Integer count = updates.get();
			updates.remove();
			if (count == null) {
				throw new IllegalStateException("SQL capture was not started");
			}
			return count;
		}

		@Override
		public String inspect(String sql) {
			Integer count = updates.get();
			if (count != null && UPDATE.matcher(sql).find()) {
				updates.set(count + 1);
			}
			return sql;
		}
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class SqlInspectionConfiguration {
		@Bean
		HibernatePropertiesCustomizer captureUpdates() {
			return properties -> properties.put("hibernate.session_factory.statement_inspector", SQL_UPDATES);
		}
	}

	@Test
	void createsAdminAndReadsItBackWithoutProfiles() throws Exception {
		String email = uniqueEmail("created");
		long userId = createAdmin(email);

		JsonNode users = getUsers(email, null);
		assertThat(users.size()).isEqualTo(1);
		assertThat(users.get(0).path("id").asLong()).isEqualTo(userId);
		assertThat(users.get(0).path("email").asText()).isEqualTo(email);
		assertThat(users.get(0).path("role").asText()).isEqualTo(UserRole.ADMIN.name());

		User savedUser = userRepository.findById(userId).orElseThrow();
		assertThat(savedUser.getEmail()).isEqualTo(email);
		assertThat(savedUser.getRole()).isEqualTo(UserRole.ADMIN);
		assertThat(teacherProfileRepository.existsById(userId)).isFalse();
		assertThat(studentProfileRepository.existsById(userId)).isFalse();
	}

	@Test
	void filtersCreatedAdminByRole() throws Exception {
		String email = uniqueEmail("created");
		long userId = createAdmin(email);

		JsonNode admins = getUsers(email, UserRole.ADMIN.name());
		assertThat(admins.size()).isEqualTo(1);
		assertThat(admins.get(0).path("id").asLong()).isEqualTo(userId);
		assertThat(admins.get(0).path("email").asText()).isEqualTo(email);
		assertThat(admins.get(0).path("role").asText()).isEqualTo(UserRole.ADMIN.name());

		JsonNode teachers = getUsers(email, UserRole.TEACHER.name());
		assertThat(teachers.size()).isZero();
	}

	private String login(String email, String password) throws Exception {
		LoginRequest request = new LoginRequest(email, password);
		MockHttpServletRequestBuilder httpRequest = post(LOGIN_PATH)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request));
		ResultActions result = mockMvc.perform(httpRequest);
		result.andExpect(status().isOk());
		result.andExpect(jsonPath("$.user.email").value(email));
		result.andExpect(jsonPath("$.user.role").value(UserRole.ADMIN.name()));
		String response = result.andReturn().getResponse().getContentAsString();
		String token = objectMapper.readTree(response).path("accessToken").asText();
		assertThat(token).isNotBlank();
		return token;
	}

	private long createAdmin(String email) throws Exception {
		CreateUserRequest request = new CreateUserRequest(ADMIN_FULL_NAME, email, newTestPassword(),
				UserRole.ADMIN.name(), null, null, null, null);
		MockHttpServletRequestBuilder httpRequest = post(ADMIN_USERS_PATH)
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
				.contentType(MediaType.APPLICATION_JSON)
				.content(objectMapper.writeValueAsString(request));
		ResultActions result = mockMvc.perform(httpRequest);
		result.andExpect(status().isCreated());
		result.andExpect(jsonPath("$.user.id").exists());
		result.andExpect(jsonPath("$.user.email").value(email));
		result.andExpect(jsonPath("$.user.role").value(UserRole.ADMIN.name()));
		String response = result.andReturn().getResponse().getContentAsString();
		long userId = objectMapper.readTree(response).path("user").path("id").asLong();
		assertThat(userId).isPositive();
		return userId;
	}

	private JsonNode getUsers(String email, String role) throws Exception {
		MockHttpServletRequestBuilder request = get(ADMIN_USERS_PATH)
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
				.param("q", email);
		if (role != null) {
			request.param("role", role);
		}
		String response = mockMvc.perform(request)
				.andExpect(status().isOk())
				.andReturn().getResponse().getContentAsString();
		JsonNode users = objectMapper.readTree(response).path("data");
		assertThat(users.isArray()).isTrue();
		return users;
	}

	private static String uniqueEmail(String purpose) {
		String uniqueId = UUID.randomUUID().toString().replace("-", "");
		String suffix = "+be62-" + purpose + "-" + uniqueId;
		return ADMIN_EMAIL.replace("@", suffix + "@");
	}

	private static String newTestPassword() {
		return "Test1!" + UUID.randomUUID();
	}
}
