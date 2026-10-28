package com.english_hub.core.modules.user.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.modules.auth.presentation.rest.dto.LoginRequest;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.application.page.UserPageRequest;
import com.english_hub.core.modules.user.presentation.rest.dto.CreateUserRequest;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest(properties = {
		"spring.jpa.properties.hibernate.session_factory.statement_inspector="
				+ "com.english_hub.core.modules.user.integration.AdminUserApiIntegrationTest$SqlCapture",
		"spring.jpa.properties.hibernate.cache.use_second_level_cache=false",
		"spring.jpa.properties.hibernate.cache.use_query_cache=false",
		"app.cache.enabled=false",
		"spring.cache.type=none"
})
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@Transactional
class AdminUserApiIntegrationTest {

	private static final String ADMIN_USERS_PATH = "/api/v1/admin/users";
	private static final String LOGIN_PATH = "/api/v1/auth/login";
	private static final String ADMIN_FULL_NAME = "Hoàng Thanh Ngân";
	private static final String ADMIN_EMAIL = "hoang.thanh.ngan@utc-polyglot.edu.vn";

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
	@Autowired
	private com.english_hub.core.modules.user.domain.repository.UserRepository domainUsers;
	@Autowired
	private EntityManager entityManager;
	private final List<User> fixture = new ArrayList<>();
	private String marker;
	private String accessToken;

	AdminUserApiIntegrationTest(
			MockMvc mockMvc,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			PasswordEncoder passwordEncoder,
			ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.passwordEncoder = passwordEncoder;
		this.objectMapper = objectMapper;
	}

	@BeforeEach
	void setUp() throws Exception {
		marker = "be70" + UUID.randomUUID().toString().replace("-", "");
		String email = marker + "-caller@example.invalid";
		String password = newTestPassword();
		String hash = passwordEncoder.encode(password);
		User caller = new User(ADMIN_FULL_NAME, email, null, hash,
				UserRole.ADMIN, UserStatus.ACTIVE, false);
		fixture.add(userRepository.saveAndFlush(caller));
		accessToken = login(email, password);
		addFixtureUser(UserRole.ADMIN, 0, false, hash);
		for (int i = 0; i < 30; i++) {
			addFixtureUser(UserRole.TEACHER, i, false, hash);
			addFixtureUser(UserRole.STUDENT, i, false, hash);
		}
		addFixtureUser(UserRole.TEACHER, 30, true, hash);
		addFixtureUser(UserRole.STUDENT, 30, true, hash);
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

	@ParameterizedTest
	@ValueSource(strings = {"TEACHER", "STUDENT", "ALL"})
	void repositoryListDoesNotLoadProfilesOrScaleQueriesWithRows(String role) throws Exception {
		UserRole filter = role.equals("ALL") ? null : UserRole.valueOf(role);
		var small = measure("repository " + role + " limit=2",
				() -> domainUsers.findPage(marker, filter, new UserPageRequest(1, 2)));
		var large = measure("repository " + role + " limit=20",
				() -> domainUsers.findPage(marker, filter, new UserPageRequest(1, 20)));
		assertThat(small.result().users()).hasSize(2);
		assertThat(large.result().users()).hasSize(20);
		assertThat(small.selects()).hasSize(2);
		assertThat(large.selects()).hasSameSizeAs(small.selects());
		assertThat(small.profileSelects()).isZero();
		assertThat(large.profileSelects()).isZero();
		assertThat(large.result().total()).isEqualTo(visible(filter).size());
		for (var user : large.result().users()) {
			assertThat(user.specialization()).isNull();
			assertThat(user.studentCode()).isNull();
			assertThat(user.dateOfBirth()).isNull();
			assertThat(user.parentPhone()).isNull();
		}
	}

	@ParameterizedTest
	@ValueSource(strings = {"TEACHER", "STUDENT", "ALL"})
	void httpListDoesNotSelectProfilesIncludingTheAdminCaller(String role) throws Exception {
		String filter = role.equals("ALL") ? null : role;
		var small = measure("HTTP " + role + " limit=2", () -> list(marker, filter, 1, 2));
		var large = measure("HTTP " + role + " limit=20", () -> list(marker, filter, 1, 20));
		assertThat(small.selects()).hasSize(3);
		assertThat(large.selects()).hasSameSizeAs(small.selects());
		assertThat(small.profileSelects()).isZero();
		assertThat(large.profileSelects()).isZero();
		assertPage(small.result(), visible(filter == null ? null : UserRole.valueOf(filter)), 1, 2);
		assertPage(large.result(), visible(filter == null ? null : UserRole.valueOf(filter)), 1, 20);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"ADMIN", "TEACHER", "STUDENT", " teacher ", "   "})
	void filtersRolesAndPreservesTheCallerInTheMatchingList(String role) throws Exception {
		UserRole filter = role == null || role.isBlank() ? null : UserRole.fromApiValue(role);
		assertPage(list(marker, role, 1, 100), visible(filter), 1, 100);
	}

	@ParameterizedTest
	@ValueSource(strings = {"name", "email", "case", "trim", "null", "blank", "missing", "long"})
	void searchesNamesAndEmailsWithExistingNormalization(String variant) throws Exception {
		String query = switch (variant) {
			case "name" -> marker + " TEACH";
			case "email" -> marker + "-student-";
			case "case" -> (marker + "-teacher-").toUpperCase(Locale.ROOT);
			case "trim" -> "  " + marker + "-teacher-  ";
			case "null" -> null;
			case "blank" -> "   ";
			case "missing" -> marker + "-absent";
			default -> marker + "x".repeat(1024);
		};
		String normalized = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
		List<User> candidates = normalized.isEmpty()
				? userRepository.findByDeletedFalse(Sort.by(Sort.Direction.ASC, "id")) : visible(null);
		List<User> expected = candidates.stream().filter(user ->
				user.getFullName().toLowerCase(Locale.ROOT).contains(normalized)
						|| user.getEmail().toLowerCase(Locale.ROOT).contains(normalized)).toList();
		assertPage(list(query, null, 1, 100), expected, 1, 100);
		if (query == null) {
			assertThat(domainUsers.findPage(null, null, new UserPageRequest(1, 100)).users())
					.extracting(com.english_hub.core.modules.user.domain.model.User::id)
					.containsExactlyElementsOf(expected.stream().limit(100).map(User::getId).toList());
		}
	}

	@ParameterizedTest
	@ValueSource(strings = {"%", "_", " TEACHER Nguyễn Ánh", " TEACHER NGUYỄN ÁNH"})
	void specialSearchesPreserveAValidSummaryWithoutDefiningNewSearchSemantics(String suffix) throws Exception {
		// Characterization only: PM has not requested literal wildcard or accent normalization semantics.
		var result = measure("HTTP special q", () -> list(marker + suffix, null, 1, 100));
		assertThat(result.profileSelects()).isZero();
		assertThat(result.result().path("pagination").path("total").asLong())
				.isEqualTo(result.result().path("data").size());
		assertSummaries(result.result().path("data"), visible(null));
	}

	@ParameterizedTest
	@CsvSource({"teacher,TEACHER", "teacher,STUDENT", "student,STUDENT", "student,ADMIN"})
	void combinesKeywordAndRoleWithTheCorrectTotal(String keyword, String role) throws Exception {
		List<User> expected = visible(UserRole.valueOf(role)).stream()
				.filter(user -> user.getEmail().contains("-" + keyword + "-")).toList();
		assertPage(list(marker + "-" + keyword + "-", role, 1, 7), expected, 1, 7);
	}

	@ParameterizedTest
	@CsvSource({"ALL,7", "TEACHER,7", "STUDENT,7", "ALL,1", "ALL,100"})
	void paginatesInIdOrderThroughTheLastAndBeyondLastPage(String role, int limit) throws Exception {
		String filter = role.equals("ALL") ? null : role;
		List<User> expected = visible(filter == null ? null : UserRole.valueOf(filter));
		List<Long> found = new ArrayList<>();
		int lastPage = (expected.size() + limit - 1) / limit;
		for (int page = 1; page <= lastPage + 1; page++) {
			JsonNode result = list(marker, filter, page, limit);
			assertPage(result, expected, page, limit);
			for (JsonNode user : result.path("data")) {
				found.add(user.path("id").asLong());
			}
		}
		assertThat(found).containsExactlyElementsOf(expected.stream().map(User::getId).toList());
	}

	@ParameterizedTest
	@ValueSource(strings = {"TEACHER", "STUDENT"})
	void excludesDeletedUsersFromBothRowsAndTotal(String role) throws Exception {
		User deleted = fixture.stream().filter(user -> user.isDeleted() && user.getRole().name().equals(role))
				.findFirst().orElseThrow();
		assertPage(list(deleted.getEmail(), role, 1, 100), List.of(), 1, 100);
		assertPage(list(marker, role, 1, 100), visible(UserRole.valueOf(role)), 1, 100);
	}

	@ParameterizedTest
	@ValueSource(strings = {"TEACHER", "STUDENT"})
	void returnsExactlyFiveFieldsAndUnchangedStatusesEvenWithoutAProfile(String role) throws Exception {
		User missing = visible(UserRole.valueOf(role)).getLast();
		assertThat(teacherProfileRepository.existsById(missing.getId())).isFalse();
		assertThat(studentProfileRepository.existsById(missing.getId())).isFalse();
		assertPage(list(missing.getEmail(), role, 1, 100), List.of(missing), 1, 100);
		JsonNode result = list(marker, role, 1, 100);
		assertPage(result, visible(UserRole.valueOf(role)), 1, 100);
		List<String> statuses = new ArrayList<>();
		result.path("data").forEach(user -> statuses.add(user.path("status").asText()));
		assertThat(statuses).contains("ACTIVE", "LOCKED");
	}

	@ParameterizedTest
	@CsvSource(value = {"NULL|NULL|200", "EMPTY|EMPTY|200", "1.5|20|400", "abc|20|400",
			"1|1.5|400", "1|abc|400", "2147483648|20|400", "1|2147483648|400"}, delimiter = '|')
	void bindsEmptyParametersToDefaultsAndRejectsNonIntegers(String page, String limit, int expectedStatus)
			throws Exception {
		var request = listRequest(marker, null);
		if (!page.equals("NULL")) request.param("page", page.equals("EMPTY") ? "" : page);
		if (!limit.equals("NULL")) request.param("limit", limit.equals("EMPTY") ? "" : limit);
		var response = mockMvc.perform(request).andExpect(status().is(expectedStatus)).andReturn().getResponse();
		if (expectedStatus == 200) {
			assertPage(objectMapper.readTree(response.getContentAsString()), visible(null), 1, 20);
		} else {
			assertThat(objectMapper.readTree(response.getContentAsString()).path("error").asText())
					.isEqualTo("Dữ liệu không hợp lệ.");
		}
	}

	@ParameterizedTest
	@CsvSource({"2147483647,1,200", "2147483647,100,400", "21474837,100,200", "21474838,100,400"})
	void validatesJpaOffsetBoundariesWithoutIntegerOverflow(int page, int limit, int expectedStatus) throws Exception {
		var response = mockMvc.perform(listRequest(marker, null)
				.param("page", Integer.toString(page)).param("limit", Integer.toString(limit)))
				.andExpect(status().is(expectedStatus)).andReturn().getResponse();
		JsonNode result = objectMapper.readTree(response.getContentAsString());
		if (expectedStatus == 200) {
			assertPage(result, visible(null), page, limit);
		} else {
			assertThat(result.path("error").asText()).isEqualTo("Dữ liệu phân trang không hợp lệ.");
		}
	}

	@ParameterizedTest
	@ValueSource(strings = {"TEACHER", "STUDENT"})
	void findByIdStillLoadsTheFullProfileAndProvidesASqlPositiveControl(String role) throws Exception {
		User expected = visible(UserRole.valueOf(role)).getFirst();
		var result = measure("findById positive control " + role,
				() -> domainUsers.findById(expected.getId()).orElseThrow());
		assertThat(result.profileSelects()).isPositive();
		assertProfile(result.result(), expected);
	}

	@Test
	void findAllRetainsFullProfilesWithAtMostThreeSelects() throws Exception {
		var result = measure("findAll batch", domainUsers::findAll);
		assertThat(result.selects()).hasSize(3);
		assertThat(result.profileSelects()).isEqualTo(2);
		var scoped = result.result().stream().filter(user -> user.email().contains(marker)).toList();
		assertThat(scoped).extracting(com.english_hub.core.modules.user.domain.model.User::id)
				.containsExactlyElementsOf(visible(null).stream().map(User::getId).toList());
		for (var user : scoped) {
			User expected = fixture.stream().filter(row -> row.getId().equals(user.id())).findFirst().orElseThrow();
			if (expected.getRole() != UserRole.ADMIN && !expected.getEmail().contains("-29@")) {
				assertProfile(user, expected);
			} else {
				assertThat(user.specialization()).isNull();
				assertThat(user.studentCode()).isNull();
				assertThat(user.dateOfBirth()).isNull();
				assertThat(user.parentPhone()).isNull();
			}
		}
	}

	private void addFixtureUser(UserRole role, int index, boolean deleted, String hash) {
		User user = userRepository.saveAndFlush(new User(marker + " " + role + " Nguyễn Ánh " + index,
				marker + "-" + role.name().toLowerCase(Locale.ROOT) + "-" + index + "@example.invalid",
				null, hash, role, index % 3 == 0 ? UserStatus.LOCKED : UserStatus.ACTIVE, deleted));
		fixture.add(user);
		if (!deleted && index != 29) {
			if (role == UserRole.TEACHER) {
				teacherProfileRepository.saveAndFlush(new TeacherProfile(user, "IELTS Writing " + user.getId()));
			} else if (role == UserRole.STUDENT) {
				studentProfileRepository.saveAndFlush(new StudentProfile(user, "BE70-" + user.getId(),
						LocalDate.of(2004, 4, 1), "0912345678"));
			}
		}
	}

	private List<User> visible(UserRole role) {
		return fixture.stream().filter(user -> !user.isDeleted() && (role == null || user.getRole() == role))
				.sorted(Comparator.comparing(User::getId)).toList();
	}

	private MockHttpServletRequestBuilder listRequest(String query, String role) {
		var request = get(ADMIN_USERS_PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken);
		if (query != null) {
			request.param("q", query);
		}
		if (role != null) {
			request.param("role", role);
		}
		return request;
	}

	private JsonNode list(String query, String role, int page, int limit) throws Exception {
		String body = mockMvc.perform(listRequest(query, role)
				.param("page", Integer.toString(page)).param("limit", Integer.toString(limit)))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return objectMapper.readTree(body);
	}

	private void assertPage(JsonNode result, List<User> expected, int page, int limit) {
		assertThat(result.path("pagination").path("page").asInt()).isEqualTo(page);
		assertThat(result.path("pagination").path("limit").asInt()).isEqualTo(limit);
		assertThat(result.path("pagination").path("total").asLong()).isEqualTo(expected.size());
		long offset = (long) (page - 1) * limit;
		List<User> rows = offset >= expected.size() ? List.of()
				: expected.subList((int) offset, (int) Math.min(offset + limit, expected.size()));
		JsonNode data = result.path("data");
		assertThat(data.size()).isEqualTo(rows.size());
		for (int i = 0; i < rows.size(); i++) {
			assertThat(data.get(i).path("id").asLong()).isEqualTo(rows.get(i).getId());
		}
		assertSummaries(data, rows);
	}

	private void assertSummaries(JsonNode data, List<User> expectedRows) {
		assertThat(data.isArray()).isTrue();
		for (JsonNode item : data) {
			assertThat(item.size()).isEqualTo(5);
			for (String field : List.of("id", "fullName", "email", "role", "status")) {
				assertThat(item.has(field)).isTrue();
			}
			User expected = expectedRows.stream().filter(user -> user.getId().equals(item.path("id").asLong()))
					.findFirst().orElseThrow();
			assertThat(expected.isDeleted()).isFalse();
			assertThat(item.path("fullName").asText()).isEqualTo(expected.getFullName());
			assertThat(item.path("email").asText()).isEqualTo(expected.getEmail());
			assertThat(item.path("role").asText()).isEqualTo(expected.getRole().name());
			assertThat(item.path("status").asText()).isEqualTo(expected.getStatus().name());
		}
	}

	private void assertProfile(com.english_hub.core.modules.user.domain.model.User user, User expected) {
		if (expected.getRole() == UserRole.TEACHER) {
			assertThat(user.specialization()).isEqualTo("IELTS Writing " + expected.getId());
		} else {
			assertThat(user.studentCode()).isEqualTo("BE70-" + expected.getId());
			assertThat(user.dateOfBirth()).isEqualTo(LocalDate.of(2004, 4, 1));
			assertThat(user.parentPhone()).isEqualTo("0912345678");
		}
	}

	private <T> Measurement<T> measure(String label, CheckedSupplier<T> action) throws Exception {
		entityManager.flush();
		entityManager.clear();
		SqlCapture.ACTIVE.set(new ArrayList<>());
		try {
			T result = action.get();
			var measurement = new Measurement<>(result, List.copyOf(SqlCapture.ACTIVE.get()));
			System.out.printf("BE70 %s SELECT=%d PROFILE_SELECT=%d%n", label,
					measurement.selects().size(), measurement.profileSelects());
			return measurement;
		} finally {
			SqlCapture.ACTIVE.remove();
		}
	}

	@FunctionalInterface
	private interface CheckedSupplier<T> {
		T get() throws Exception;
	}

	private record Measurement<T>(T result, List<String> selects) {
		long profileSelects() {
			return selects.stream().filter(sql -> sql.contains("teacher_profiles") || sql.contains("student_profiles")).count();
		}
	}

	public static class SqlCapture implements StatementInspector {
		private static final ThreadLocal<List<String>> ACTIVE = new ThreadLocal<>();

		@Override
		public String inspect(String sql) {
			String normalized = sql.replaceAll("(?s)/\\*.*?\\*/", "").stripLeading().toLowerCase(Locale.ROOT);
			if (ACTIVE.get() != null && normalized.startsWith("select")) {
				ACTIVE.get().add(normalized);
			}
			return sql;
		}
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
