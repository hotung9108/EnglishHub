package com.english_hub.core.modules.student_evaluation.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
import com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class StudentEvaluationApiIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_student_evaluation_api_test")
			.withUsername("test")
			.withPassword("test");

	@org.springframework.test.context.DynamicPropertySource
	static void registerPostgresProperties(org.springframework.test.context.DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final MockMvc mockMvc;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final ClassJpaRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final StudentEvaluationRepository evaluationRepository;
	private final JwtTokenService jwtTokenService;
	private final ObjectMapper objectMapper;

	StudentEvaluationApiIntegrationTest(
			MockMvc mockMvc,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			ClassJpaRepository classRepository,
			ClassMemberRepository classMemberRepository,
			StudentEvaluationRepository evaluationRepository,
			JwtTokenService jwtTokenService,
			ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.evaluationRepository = evaluationRepository;
		this.jwtTokenService = jwtTokenService;
		this.objectMapper = objectMapper;
	}

	private long teacherOneId;
	private long teacherTwoId;
	private long studentOneId;
	private long studentTwoId;
	private long adminId;
	private long classOneId;
	private long classTwoId;

	@BeforeEach
	void setUp() {
		teacherOneId = createUser(UserRole.TEACHER, "Evaluation Teacher One");
		teacherTwoId = createUser(UserRole.TEACHER, "Evaluation Teacher Two");
		studentOneId = createUser(UserRole.STUDENT, "Evaluation Student One");
		studentTwoId = createUser(UserRole.STUDENT, "Evaluation Student Two");
		adminId = createUser(UserRole.ADMIN, "Evaluation Admin");
		teacherProfileRepository.save(new TeacherProfile(user(teacherOneId), "English"));
		teacherProfileRepository.save(new TeacherProfile(user(teacherTwoId), "English"));
		studentProfileRepository.save(new StudentProfile(
				user(studentOneId), studentCode(), LocalDate.of(2004, 3, 4), null));
		studentProfileRepository.save(new StudentProfile(
				user(studentTwoId), studentCode(), LocalDate.of(2005, 4, 5), null));

		classOneId = createClass(teacherOneId, "Evaluation Class One");
		classTwoId = createClass(teacherOneId, "Evaluation Class Two");
		classMemberRepository.save(new ClassMember(classOneId, studentOneId));
		classMemberRepository.save(new ClassMember(classTwoId, studentOneId));
		classMemberRepository.save(new ClassMember(classTwoId, studentTwoId));
	}

	@Test
	void createChecksCurrentTeacherAndMembershipThenOriginalAuthorCanEditAndDelete() throws Exception {
		String body = "{\"classId\":" + classOneId + ",\"content\":\"Good progress\"}";

		mockMvc.perform(post("/api/v1/students/{id}/evaluations", studentOneId)
					.header("Authorization", bearer(teacherTwoId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));

		String created = mockMvc.perform(post("/api/v1/students/{id}/evaluations", studentOneId)
					.header("Authorization", bearer(teacherOneId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Đã lưu đánh giá."))
				.andExpect(jsonPath("$.id").isNumber())
				.andReturn().getResponse().getContentAsString();
		long evaluationId = objectMapper.readTree(created).get("id").asLong();

		ClassEntity classEntity = classRepository.findById(classOneId).orElseThrow();
		classEntity.setTeacherId(teacherTwoId);
		classRepository.saveAndFlush(classEntity);

		mockMvc.perform(put("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(teacherTwoId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"content\":\"Edited by a different teacher\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(teacherOneId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"content\":\"Updated by original teacher\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật đánh giá thành công."));

		mockMvc.perform(get("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(studentOneId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(evaluationId))
				.andExpect(jsonPath("$.content").value("Updated by original teacher"))
				.andExpect(jsonPath("$.classId").doesNotExist())
				.andExpect(jsonPath("$.teacherName").doesNotExist())
				.andExpect(jsonPath("$.createdAt").doesNotExist());

		mockMvc.perform(get("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(studentTwoId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));

		mockMvc.perform(delete("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(teacherOneId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá đánh giá."));

		mockMvc.perform(get("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(teacherOneId, UserRole.TEACHER)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy đánh giá."));
	}

	@Test
	void createRejectsStudentWhoBelongsToAnotherClassButNotRequestedClass() throws Exception {
		String body = "{\"classId\":" + classOneId + ",\"content\":\"Good progress\"}";

		mockMvc.perform(post("/api/v1/students/{id}/evaluations", studentTwoId)
					.header("Authorization", bearer(teacherOneId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Học viên không thuộc lớp học này."));
	}

	@Test
	void listFiltersAndPaginatesForTeachersAndRestrictsStudentsAndAdmins() throws Exception {
		long oldestId = saveEvaluation(studentOneId, teacherOneId, classOneId, "Oldest", "2026-09-20T10:00:00Z");
		long newestId = saveEvaluation(studentOneId, teacherOneId, classOneId, "Newest", "2026-09-22T10:00:00Z");
		saveEvaluation(studentOneId, teacherOneId, classTwoId, "Other class", "2026-09-21T10:00:00Z");

		mockMvc.perform(get("/api/v1/students/{id}/evaluations", studentOneId)
					.param("classId", Long.toString(classOneId))
					.param("page", "1")
					.param("limit", "1")
					.header("Authorization", bearer(teacherTwoId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(1))
				.andExpect(jsonPath("$.data[0].id").value(newestId))
				.andExpect(jsonPath("$.data[0].classId").value(classOneId))
				.andExpect(jsonPath("$.data[0].teacherName").value("Evaluation Teacher One"))
				.andExpect(jsonPath("$.data[0].content").value("Newest"))
				.andExpect(jsonPath("$.data[0].createdAt").exists())
				.andExpect(jsonPath("$.data[0].studentId").doesNotExist())
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(1))
				.andExpect(jsonPath("$.pagination.total").value(2));

		mockMvc.perform(get("/api/v1/students/{id}/evaluations", studentOneId)
					.header("Authorization", bearer(studentOneId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.length()").value(3))
				.andExpect(jsonPath("$.data[0].id").value(newestId))
				.andExpect(jsonPath("$.pagination.total").value(3));

		mockMvc.perform(get("/api/v1/students/{id}/evaluations", studentTwoId)
					.header("Authorization", bearer(studentOneId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));

		mockMvc.perform(get("/api/v1/students/{id}/evaluations", studentOneId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/students/{id}/evaluations", Long.MAX_VALUE)
					.header("Authorization", bearer(teacherOneId, UserRole.TEACHER)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy học viên."));
	}

	@Test
	void adminCannotGetEvaluationDetail() throws Exception {
		long evaluationId = saveEvaluation(
				studentOneId, teacherOneId, classOneId, "Admin detail fixture", "2026-09-22T10:00:00Z");

		mockMvc.perform(get("/api/v1/evaluations/{id}", evaluationId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void unauthenticatedRequestUsesTheConfigured401Message() throws Exception {
		mockMvc.perform(get("/api/v1/evaluations/1"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));
	}

	private long createUser(UserRole role, String name) {
		return userRepository.save(new User(
				name,
				name.toLowerCase().replace(' ', '.') + "." + UUID.randomUUID() + "@test.local",
				null,
				"test-hash",
				role,
				UserStatus.ACTIVE,
				false)).getId();
	}

	private User user(long id) {
		return userRepository.findById(id).orElseThrow();
	}

	private long createClass(long teacherId, String name) {
		return classRepository.saveAndFlush(new ClassEntity(
				name + " " + UUID.randomUUID(),
				"Intermediate",
				"Student evaluation integration fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
	}

	private long saveEvaluation(long studentId, long teacherId, long classId, String content, String createdAt) {
		StudentEvaluation evaluation = new StudentEvaluation(studentId, teacherId, classId, content);
		ReflectionTestUtils.setField(evaluation, "createdAt", Instant.parse(createdAt));
		return evaluationRepository.saveAndFlush(evaluation).getId();
	}

	private String bearer(long userId, UserRole role) {
		return "Bearer " + jwtTokenService.createAccessToken(
				userId,
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name()));
	}

	private String studentCode() {
		return "SE-" + UUID.randomUUID().toString().substring(0, 10);
	}
}
