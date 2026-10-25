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
import com.english_hub.core.modules.user.presentation.rest.dto.CreateUserRequest;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;
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
		String email = uniqueEmail("caller");
		String password = newTestPassword();
		User caller = new User(ADMIN_FULL_NAME, email, null, passwordEncoder.encode(password),
				UserRole.ADMIN, UserStatus.ACTIVE, false);
		userRepository.saveAndFlush(caller);
		accessToken = login(email, password);
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
