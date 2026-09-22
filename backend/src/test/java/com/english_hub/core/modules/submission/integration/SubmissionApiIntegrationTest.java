package com.english_hub.core.modules.submission.integration;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
import com.english_hub.core.infrastructure.persistence.entity.ClassStatus;
import com.english_hub.core.infrastructure.persistence.entity.EnglishClass;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SubmissionApiIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtTokenService jwtTokenService;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private EnglishClassRepository englishClassRepository;

	@Autowired
	private ClassMemberRepository classMemberRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private AssignmentModuleRepository assignmentModuleRepository;

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private SubmissionModuleRepository submissionModuleRepository;

	@Autowired
	private GradingRepository gradingRepository;

	private Long teacherId;
	private Long studentMemberId;
	private Long studentOtherId;
	private Long classId;
	private Long publishedAssignmentId;
	private Long quizModuleId;
	private Long essayModuleId;

	@BeforeEach
	void setUp() {
		teacherId = user(UserRole.TEACHER, "Giáo viên");
		studentMemberId = user(UserRole.STUDENT, "Học viên chính thức");
		studentOtherId = user(UserRole.STUDENT, "Học viên ngoài lớp");
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "IELTS"));
		studentProfileRepository.save(new StudentProfile(user(studentMemberId), "HV0001",
				LocalDate.of(2004, 4, 1), "0912345678"));
		studentProfileRepository.save(new StudentProfile(user(studentOtherId), "HV0002",
				LocalDate.of(2005, 5, 2), "0912345679"));

		classId = englishClassRepository.save(new EnglishClass(
				"IELTS 6.5 - K12",
				"Intermediate",
				"Luyện IELTS",
				LocalDate.of(2026, 9, 15),
				LocalDate.of(2027, 1, 31),
				ClassStatus.ACTIVE,
				teacherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentMemberId));

		publishedAssignmentId = assignment(
				AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(48),
				2,
				false);
		quizModuleId = module(publishedAssignmentId, ModuleSkill.READING, ModuleTaskType.QUIZ, 1);
		essayModuleId = module(publishedAssignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 2);
	}

	@Test
	void startsAClassifiedAttemptForAStudent() throws Exception {
		String response = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.assignmentId").value(publishedAssignmentId))
				.andExpect(jsonPath("$.attemptNumber").value(1))
				.andExpect(jsonPath("$.status").value("IN_PROGRESS"))
				.andExpect(jsonPath("$.createdAt").exists())
				.andExpect(jsonPath("$.modules", hasSize(2)))
				.andExpect(jsonPath("$.modules[0].id").isNumber())
				.andExpect(jsonPath("$.modules[0].moduleId").value(quizModuleId))
				.andExpect(jsonPath("$.modules[0].skill").value("READING"))
				.andExpect(jsonPath("$.modules[0].status").value("IN_PROGRESS"))
				.andExpect(jsonPath("$.modules[1].moduleId").value(essayModuleId))
				.andExpect(jsonPath("$.modules[1].skill").value("WRITING"))
				.andReturn().getResponse().getContentAsString();
		long submissionId = jsonLong(response, "id");

		assertThat(submissionRepository.countByAssignmentIdAndStudentId(publishedAssignmentId, studentMemberId))
				.isEqualTo(1);
		List<SubmissionModule> submissionModules = submissionModuleRepository.findBySubmissionId(submissionId);
		assertThat(submissionModules).hasSize(2);
		List<Grading> gradings =
				gradingRepository.findBySubmissionModuleIds(
						submissionModules.stream().map(SubmissionModule::getId).toList());
		assertThat(gradings).hasSize(2);
		assertThat(gradings).extracting(Grading::getMethod)
				.containsExactlyInAnyOrder(GradingMethod.AUTO, GradingMethod.TEACHER_MANUAL);
	}

	@Test
	void incrementsAttemptNumberForASecondAttempt() throws Exception {
		assertAttemptNumber(1);
		assertAttemptNumber(2);
	}

	@Test
	void rejectsADraftAssignment() throws Exception {
		long draftId = assignment(AssignmentStatus.DRAFT,
				OffsetDateTime.now().minusHours(1), OffsetDateTime.now().plusHours(48), 2, false);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", draftId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsAnAssignmentThatIsNotOpenYet() throws Exception {
		long futureId = assignment(AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().plusMinutes(30), OffsetDateTime.now().plusHours(48), 2, false);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", futureId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsAnAssignmentThatHasClosed() throws Exception {
		long closedId = assignment(AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(48), OffsetDateTime.now().minusMinutes(5), 2, false);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", closedId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsASubmissionBeyondTheLimit() throws Exception {
		long singleAttemptId = assignment(AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1), OffsetDateTime.now().plusHours(48), 1, false);
		module(singleAttemptId, ModuleSkill.READING, ModuleTaskType.QUIZ, 1);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", singleAttemptId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated());
		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", singleAttemptId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsAnUnknownAssignment() throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", 99999999L)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy bài tập."));
	}

	@Test
	void rejectsASoftDeletedAssignment() throws Exception {
		long deletedId = assignment(AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1), OffsetDateTime.now().plusHours(48), 2, true);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", deletedId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy bài tập."));
	}

	@Test
	void rejectsANonStudentCaller() throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void rejectsAStudentWhoIsNotInTheClass() throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(studentOtherId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	private void assertAttemptNumber(int expected) throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.attemptNumber").value(expected));
	}

	private long assignment(AssignmentStatus status, OffsetDateTime openAt, OffsetDateTime closeAt,
			Integer maxSubmissions, boolean deleted) {
		return assignmentRepository.save(new Assignment(
				classId,
				"Bài tập " + status,
				"Test assignment",
				openAt,
				closeAt,
				maxSubmissions,
				deleted,
				status)).getId();
	}

	private long module(long assignmentId, ModuleSkill skill, ModuleTaskType taskType, int orderIndex) {
		return assignmentModuleRepository.save(new AssignmentModule(
				assignmentId,
				skill,
				taskType,
				orderIndex,
				"Instructions",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null)).getId();
	}

	private String bearer(long userId, UserRole role) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
		return "Bearer " + jwtTokenService.createAccessToken(userId, tokenRole);
	}

	private long user(UserRole role, String fullName) {
		String suffix = UUID.randomUUID().toString().substring(0, 8);
		User user = new User(
				fullName,
				role.name().toLowerCase() + "-" + suffix + "@englishhub.test",
				"0912345678",
				"hash",
				role,
				UserStatus.ACTIVE,
				false);
		return userRepository.save(user).getId();
	}

	private com.english_hub.core.modules.user.infrastructure.persistence.entity.User user(Long userId) {
		return userRepository.findById(userId).orElseThrow();
	}

	private long jsonLong(String json, String field) {
		Matcher matcher = Pattern.compile("\"" + field + "\"\\s*:\\s*(\\d+)").matcher(json);
		if (!matcher.find()) {
			throw new IllegalStateException("Field not found in response: " + json);
		}
		return Long.parseLong(matcher.group(1));
	}
}