package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerAnnotationRepository;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.infrastructure.seed.GradingMockDataSeeder;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
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
class GradingApiIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_grading_api_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired private MockMvc mockMvc;
	@Autowired private UserRepository userRepository;
	@Autowired private TeacherProfileRepository teacherProfileRepository;
	@Autowired private StudentProfileRepository studentProfileRepository;
	@Autowired private ClassJpaRepository classRepository;
	@Autowired private AssignmentRepository assignmentRepository;
	@Autowired private AssignmentModuleRepository moduleRepository;
	@Autowired private QuestionRepository questionRepository;
	@Autowired private SubmissionRepository submissionRepository;
	@Autowired private SubmissionModuleRepository submissionModuleRepository;
	@Autowired private AnswerRepository answerRepository;
	@Autowired private GradingRepository gradingRepository;
	@Autowired private AnswerAnnotationRepository answerAnnotationRepository;
	@Autowired private ClassMemberRepository classMemberRepository;
	@Autowired private EntityManager entityManager;
	@Autowired private JwtTokenService jwtTokenService;
	@Autowired private ObjectMapper objectMapper;

	private long teacherId;
	private long otherTeacherId;
	private long studentId;
	private long classId;
	private long assignmentId;
	private final Map<ModuleSkill, Long> moduleIds = new EnumMap<>(ModuleSkill.class);

	@BeforeEach
	void setUp() {
		teacherId = createUser(UserRole.TEACHER, "Grading API teacher");
		otherTeacherId = createUser(UserRole.TEACHER, "Other grading API teacher");
		studentId = createUser(UserRole.STUDENT, "Grading API student");
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "English"));
		teacherProfileRepository.save(new TeacherProfile(user(otherTeacherId), "English"));
		studentProfileRepository.save(new StudentProfile(
				user(studentId), "GA-" + UUID.randomUUID().toString().substring(0, 10), LocalDate.of(2004, 3, 4), null));

		classId = classRepository.save(new ClassEntity(
				"Grading API class " + UUID.randomUUID(),
				"Intermediate",
				"Grading API integration fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentId));
		assignmentId = assignmentRepository.save(new Assignment(
				classId,
				"Grading API assignment",
				"All four skills for grading integration tests",
				OffsetDateTime.parse("2026-09-10T00:00:00Z"),
				OffsetDateTime.parse("2026-09-30T00:00:00Z"),
				2,
				false,
				AssignmentStatus.PUBLISHED)).getId();

		int order = 1;
		for (ModuleSkill skill : ModuleSkill.values()) {
			ModuleTaskType taskType = switch (skill) {
				case READING, LISTENING -> ModuleTaskType.QUIZ;
				case WRITING -> ModuleTaskType.ESSAY;
				case SPEAKING -> ModuleTaskType.RECORDING;
			};
			AssignmentModule module = moduleRepository.save(new AssignmentModule(
					assignmentId,
					skill,
					taskType,
					order++,
					"Complete " + skill.name().toLowerCase() + " task",
					new BigDecimal("10.00"),
					null,
					null,
					null,
					null,
					"Grade the " + skill.name().toLowerCase() + " response"));
			moduleIds.put(skill, module.getId());
			if (skill == ModuleSkill.READING || skill == ModuleSkill.LISTENING) {
				questionRepository.save(new Question(
						module.getId(),
						"Provide the answer",
						QuestionType.SHORT_ANSWER,
						"{\"correct_answer\":\"English\"}",
						new BigDecimal("10.00"),
						1));
			}
		}
		createSubmittedAttempt();
		new GradingMockDataSeeder(
				entityManager,
				submissionModuleRepository,
				submissionRepository,
				moduleRepository,
				assignmentRepository,
				questionRepository,
				answerRepository,
				classRepositoryLegacy(),
				classMemberRepository,
				gradingRepository,
				answerAnnotationRepository,
				objectMapper).run();
	}

	@Test
	void teacherCanUpdateOwnedGradingButOtherTeacherAndOtherRoleReceiveForbidden() throws Exception {
		Grading target = gradingRepository.findAll().stream()
				.filter(grading -> grading.getStatus() == GradingStatus.AI_GRADED)
				.findFirst()
				.orElseThrow();
		String body = "{\"finalScore\":6.50,\"finalFeedback\":\"Reviewed by teacher\",\"note\":\"manual review\"}";

		mockMvc.perform(put("/api/v1/gradings/{id}", target.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật điểm thành công."));

		mockMvc.perform(put("/api/v1/gradings/{id}", target.getId())
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").isString())
				.andExpect(jsonPath("$.message").doesNotExist());

		mockMvc.perform(put("/api/v1/gradings/{id}", target.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").isString());
	}

	@Test
	void aiAnalysisAcceptsPendingWritingAndSpeakingWithoutChangingPersistedData() throws Exception {
		List<Grading> pendingGradings = gradingRepository.findAll().stream()
				.filter(grading -> grading.getStatus() == GradingStatus.PENDING)
				.toList();
		assertThat(pendingGradings).hasSize(2);

		for (Grading pending : pendingGradings) {
			var submissionModule = submissionModuleRepository.findById(pending.getSubmissionModuleId()).orElseThrow();
			var module = moduleRepository.findById(submissionModule.getModuleId()).orElseThrow();
			assertThat(module.getSkill()).isIn(ModuleSkill.WRITING, ModuleSkill.SPEAKING);
			mockMvc.perform(post("/api/v1/submission-modules/{id}/grading/ai-analyze", submissionModule.getId())
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
					.andExpect(status().isAccepted())
					.andExpect(jsonPath("$.message").value("Đã gửi yêu cầu phân tích, vui lòng chờ."));

			entityManager.flush();
			entityManager.clear();
			Grading unchanged = gradingRepository.findById(pending.getId()).orElseThrow();
			assertThat(unchanged.getStatus()).isEqualTo(GradingStatus.PENDING);
			assertThat(unchanged.getAiFeedback()).isNull();
			assertThat(unchanged.getFinalScore()).isNull();
			assertThat(unchanged.getFinalFeedback()).isNull();
			assertThat(unchanged.getGradedAt()).isNull();
		}
	}

	@Test
	void gradingAndAnnotationEndpointsKeepTheirExistingResponseEnvelopes() throws Exception {
		mockMvc.perform(get("/api/v1/gradings")
					.param("classId", Long.toString(classId))
					.param("studentId", Long.toString(studentId))
					.param("status", "PENDING")
					.param("page", "1")
					.param("limit", "1")
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(1))
				.andExpect(jsonPath("$.pagination.total").value(2))
				.andExpect(jsonPath("$.meta").doesNotExist());

		Grading writingPending = gradingRepository.findAll().stream()
				.filter(grading -> grading.getStatus() == GradingStatus.AI_GRADED)
				.filter(grading -> {
					var submissionModule = submissionModuleRepository.findById(grading.getSubmissionModuleId()).orElseThrow();
					return moduleRepository.findById(submissionModule.getModuleId()).orElseThrow().getSkill()
							== ModuleSkill.WRITING;
				})
				.findFirst()
				.orElseThrow();
		var submissionModule = submissionModuleRepository.findById(writingPending.getSubmissionModuleId()).orElseThrow();
		long answerId = answerRepository.findAll().stream()
				.filter(answer -> answer.getSubmissionModuleId().equals(submissionModule.getId()))
				.findFirst()
				.orElseThrow()
				.getId();

		mockMvc.perform(get("/api/v1/answers/{id}/annotations", answerId)
					.param("page", "99")
					.param("size", "1")
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").isArray())
				.andExpect(jsonPath("$.data").isNotEmpty())
				.andExpect(jsonPath("$.pagination").doesNotExist())
				.andExpect(jsonPath("$.meta").doesNotExist());
	}

	private void createSubmittedAttempt() {
		OffsetDateTime submittedAt = OffsetDateTime.parse("2026-09-15T12:00:00Z");
		Submission submission = submissionRepository.save(new Submission(
				assignmentId, studentId, 1, submittedAt, SubmissionStatus.SUBMITTED));
		for (ModuleSkill skill : ModuleSkill.values()) {
			SubmissionStatus status = skill == ModuleSkill.READING || skill == ModuleSkill.LISTENING
					? SubmissionStatus.GRADED
					: SubmissionStatus.SUBMITTED;
			SubmissionModule submissionModule = submissionModuleRepository.save(new SubmissionModule(
					submission.getId(), moduleIds.get(skill), status));
			if (skill == ModuleSkill.READING || skill == ModuleSkill.LISTENING) {
				Question question = questionRepository.findAll().stream()
						.filter(candidate -> candidate.getModuleId().equals(moduleIds.get(skill)))
						.findFirst()
						.orElseThrow();
				answerRepository.save(new Answer(
						submissionModule.getId(),
						question.getId(),
						"{\"score\":2.00,\"answer_text\":\"English\"}",
						null, null, null, null, null, null, null, null, null));
			} else if (skill == ModuleSkill.WRITING) {
				answerRepository.save(new Answer(
						submissionModule.getId(), null,
						"I practise English every day and review the words I learn.",
						null, null, null, null, null, null, null, null, null));
			} else {
				answerRepository.save(new Answer(
						submissionModule.getId(), null, null,
						"audio/speaking/grading-api-fixture.mp3", 20, 320_000L, "audio/mpeg",
						com.english_hub.core.infrastructure.persistence.entity.UploadStatus.READY,
						null, null, null, null));
			}
		}
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

	private String bearer(long userId, UserRole role) {
		return "Bearer " + jwtTokenService.createAccessToken(
				userId,
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name()));
	}

	private com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository classRepositoryLegacy() {
		return legacyEnglishClassRepository;
	}

	@Autowired private com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository
		legacyEnglishClassRepository;
}
