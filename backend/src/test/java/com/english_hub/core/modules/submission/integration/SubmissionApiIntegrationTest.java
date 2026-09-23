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
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.model.Answer;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.AnswerRepository;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

	@Autowired
	private AnswerRepository answerRepository;

	@Autowired
	private QuestionRepository questionRepository;

	private Long teacherId;
	private Long teacherOtherId;
	private Long adminId;
	private Long studentMemberId;
	private Long studentOtherId;
	private Long classId;
	private Long otherClassId;
	private Long publishedAssignmentId;
	private Long quizModuleId;
	private Long essayModuleId;
	private Long quizQuestionOne;
	private Long quizQuestionTwo;

	@BeforeEach
	void setUp() {
		teacherId = user(UserRole.TEACHER, "Giáo viên");
		teacherOtherId = user(UserRole.TEACHER, "Giáo viên khác");
		adminId = user(UserRole.ADMIN, "Quản trị");
		studentMemberId = user(UserRole.STUDENT, "Học viên chính thức");
		studentOtherId = user(UserRole.STUDENT, "Học viên ngoài lớp");
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "IELTS"));
		teacherProfileRepository.save(new TeacherProfile(user(teacherOtherId), "TOEFL"));
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
		otherClassId = englishClassRepository.save(new EnglishClass(
				"TOEFL - K11",
				"Advanced",
				"Luyện TOEFL",
				LocalDate.of(2026, 9, 15),
				LocalDate.of(2027, 1, 31),
				ClassStatus.ACTIVE,
				teacherOtherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentMemberId));

		publishedAssignmentId = assignment(
				classId,
				AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(48),
				2,
				false);
		quizModuleId = module(publishedAssignmentId, ModuleSkill.READING, ModuleTaskType.QUIZ, 1);
		essayModuleId = module(publishedAssignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 2);
		quizQuestionOne = questionRepository.save(new Question(
				quizModuleId,
				"Which word best describes...?",
				QuestionType.MULTIPLE_CHOICE,
				"{\"options\":[{\"id\":1,\"content\":\"Option A\",\"isCorrect\":true},"
						+ "{\"id\":2,\"content\":\"Option B\",\"isCorrect\":false}]}",
				BigDecimal.ONE,
				1)).getId();
		quizQuestionTwo = questionRepository.save(new Question(
				quizModuleId,
				"What is the main idea...?",
				QuestionType.MULTIPLE_CHOICE,
				"{\"options\":[{\"id\":3,\"content\":\"X\",\"isCorrect\":true},"
						+ "{\"id\":4,\"content\":\"Y\",\"isCorrect\":false}]}",
				BigDecimal.ONE,
				2)).getId();
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
		long draftId = assignment(classId, AssignmentStatus.DRAFT,
				OffsetDateTime.now().minusHours(1), OffsetDateTime.now().plusHours(48), 2, false);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", draftId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsAnAssignmentThatIsNotOpenYet() throws Exception {
		long futureId = assignment(classId, AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().plusMinutes(30), OffsetDateTime.now().plusHours(48), 2, false);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", futureId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsAnAssignmentThatHasClosed() throws Exception {
		long closedId = assignment(classId, AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(48), OffsetDateTime.now().minusMinutes(5), 2, false);

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", closedId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này."));
	}

	@Test
	void rejectsASubmissionBeyondTheLimit() throws Exception {
		long singleAttemptId = assignment(classId, AssignmentStatus.PUBLISHED,
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
		long deletedId = assignment(classId, AssignmentStatus.PUBLISHED,
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

	@Test
	void getSubmissionDetailReturnsOwnAttemptForAStudent() throws Exception {
		long submissionId = startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions/{id}", submissionId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(submissionId))
				.andExpect(jsonPath("$.assignmentId").value(publishedAssignmentId))
				.andExpect(jsonPath("$.studentId").value(studentMemberId))
				.andExpect(jsonPath("$.attemptNumber").value(1))
				.andExpect(jsonPath("$.status").value("IN_PROGRESS"))
				.andExpect(jsonPath("$.createdAt").exists())
				.andExpect(jsonPath("$.modules", hasSize(2)))
				.andExpect(jsonPath("$.modules[0].moduleId").value(quizModuleId))
				.andExpect(jsonPath("$.modules[0].skill").value("READING"))
				.andExpect(jsonPath("$.modules[0].taskType").value("QUIZ"))
				.andExpect(jsonPath("$.modules[0].status").value("IN_PROGRESS"))
				.andExpect(jsonPath("$.modules[0].grading.id").isNumber())
				.andExpect(jsonPath("$.modules[0].grading.method").value("AUTO"))
				.andExpect(jsonPath("$.modules[0].grading.status").value("PENDING"))
				.andExpect(jsonPath("$.modules[1].moduleId").value(essayModuleId))
				.andExpect(jsonPath("$.modules[1].taskType").value("ESSAY"))
				.andExpect(jsonPath("$.modules[1].grading.method").value("TEACHER_MANUAL"));
	}

	@Test
	void getSubmissionDetailRejectsAnotherStudentsAttempt() throws Exception {
		long submissionId = startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions/{id}", submissionId)
						.header("Authorization", bearer(studentOtherId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void getSubmissionDetailReturnsNotFoundForUnknownSubmission() throws Exception {
		mockMvc.perform(get("/api/v1/submissions/{id}", 99999999L)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy lượt làm bài."));
	}

	@Test
	void getSubmissionDetailAllowsTheClassTeacher() throws Exception {
		long submissionId = startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions/{id}", submissionId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(submissionId))
				.andExpect(jsonPath("$.modules", hasSize(2)));
	}

	@Test
	void getSubmissionDetailRejectsATeacherWhoDoesNotTeachTheClass() throws Exception {
		long submissionId = startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions/{id}", submissionId)
						.header("Authorization", bearer(teacherOtherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void getSubmissionDetailShowsTheGradedState() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		grade(submissionId);

		mockMvc.perform(get("/api/v1/submissions/{id}", submissionId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("GRADED"))
				.andExpect(jsonPath("$.submittedAt").exists())
				.andExpect(jsonPath("$.modules[0].status").value("GRADED"))
				.andExpect(jsonPath("$.modules[0].grading.status").value("COMPLETED"))
				.andExpect(jsonPath("$.modules[0].grading.finalScore").value(8.0))
				.andExpect(jsonPath("$.modules[0].grading.maxScoreSnapshot").value(10.0))
				.andExpect(jsonPath("$.modules[0].grading.aiFeedback").value("Nhận xét AI"));
	}

	@Test
	void getSubmissionDetailAllowsAnAdmin() throws Exception {
		long submissionId = startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions/{id}", submissionId)
						.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(submissionId));
	}

	@Test
	void listSubmissionsScopesAStudentToTheirOwnAttempts() throws Exception {
		long submissionId = startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(submissionId))
				.andExpect(jsonPath("$.data[0].studentId").value(studentMemberId))
				.andExpect(jsonPath("$.data[0].attemptNumber").value(1))
				.andExpect(jsonPath("$.data[0].status").value("IN_PROGRESS"))
				.andExpect(jsonPath("$.data[0].modules", hasSize(2)))
				.andExpect(jsonPath("$.data[0].modules[0].moduleId").value(quizModuleId))
				.andExpect(jsonPath("$.data[0].modules[0].grading.status").value("PENDING"))
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(20))
				.andExpect(jsonPath("$.pagination.total").value(1));

		mockMvc.perform(get("/api/v1/submissions")
						.header("Authorization", bearer(studentOtherId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)))
				.andExpect(jsonPath("$.pagination.total").value(0));
	}

	@Test
	void listSubmissionsRejectsAStudentRequestingAnotherStudentsAttempts() throws Exception {
		mockMvc.perform(get("/api/v1/submissions")
						.param("studentId", String.valueOf(studentOtherId))
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void listSubmissionsRequiresAnAssignmentIdForATeacher() throws Exception {
		mockMvc.perform(get("/api/v1/submissions")
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("assignmentId là bắt buộc đối với giáo viên."));
	}

	@Test
	void listSubmissionsAllowsATeacherForTheirOwnAssignment() throws Exception {
		startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions")
						.param("assignmentId", String.valueOf(publishedAssignmentId))
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.pagination.total").value(1));
	}

	@Test
	void listSubmissionsRejectsATeacherForAForeignAssignment() throws Exception {
		long foreignAssignmentId = assignment(otherClassId,
				AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(48),
				2,
				false);

		mockMvc.perform(get("/api/v1/submissions")
						.param("assignmentId", String.valueOf(foreignAssignmentId))
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void listSubmissionsAppliesTheAssignmentFilter() throws Exception {
		long firstSubmissionId = startSubmissionAsStudentMember();
		long secondAssignmentId = assignment(classId,
				AssignmentStatus.PUBLISHED,
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(48),
				2,
				false);
		module(secondAssignmentId, ModuleSkill.READING, ModuleTaskType.QUIZ, 1);
		String secondResponse = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", secondAssignmentId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		long secondSubmissionId = jsonLong(secondResponse, "id");

		mockMvc.perform(get("/api/v1/submissions")
						.param("assignmentId", String.valueOf(publishedAssignmentId))
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(firstSubmissionId))
				.andExpect(jsonPath("$.pagination.total").value(1));

		mockMvc.perform(get("/api/v1/submissions")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.pagination.total").value(2))
				.andExpect(jsonPath("$.data[0].id").value(secondSubmissionId));
	}

	@Test
	void listSubmissionsShowsGradingSummariesAfterGrading() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		grade(submissionId);

		mockMvc.perform(get("/api/v1/submissions")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").doesNotExist())
				.andExpect(jsonPath("$.data[0].status").value("GRADED"))
				.andExpect(jsonPath("$.data[0].modules[0].grading.status").value("COMPLETED"))
				.andExpect(jsonPath("$.data[0].modules[0].grading.finalScore").value(8.0))
				.andExpect(jsonPath("$.data[0].modules[0].grading.maxScoreSnapshot").value(10.0));
	}

	@Test
	void listSubmissionsAllowsAnAdminWithoutFilters() throws Exception {
		startSubmissionAsStudentMember();

		mockMvc.perform(get("/api/v1/submissions")
						.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.pagination.total").value(1));
	}

	@Test
	void listSubmissionsRejectsAnInvalidStatusFilter() throws Exception {
		mockMvc.perform(get("/api/v1/submissions")
						.param("status", "INVALID_STATUS")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("status không hợp lệ."));
	}

	@Test
	void submitsQuizAnswersAndPersistsAnswersAndSubmitsModule() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}},"
				+ "{\"questionId\":" + quizQuestionTwo + ",\"content\":{\"selectedOptionIds\":[3]}}"
				+ "]}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã nộp phần làm bài."))
				.andExpect(jsonPath("$.submissionModuleId").value(submissionModuleId))
				.andExpect(jsonPath("$.status").value("SUBMITTED"))
				.andExpect(jsonPath("$.answers", hasSize(2)))
				.andExpect(jsonPath("$.answers[0].id").isNumber())
				.andExpect(jsonPath("$.answers[0].questionId").value(quizQuestionOne))
				.andExpect(jsonPath("$.answers[0].content.selectedOptionIds[0]").value(1))
				.andExpect(jsonPath("$.answers[1].questionId").value(quizQuestionTwo));

		List<Answer> answers = answerRepository.findBySubmissionModuleId(submissionModuleId);
		assertThat(answers).hasSize(2);
		assertThat(answers).extracting(Answer::getQuestionId)
				.containsExactlyInAnyOrder(quizQuestionOne, quizQuestionTwo);
		assertThat(submissionModuleRepository.findById(submissionModuleId).orElseThrow().getStatus())
				.isEqualTo(SubmissionStatus.SUBMITTED);
	}

	@Test
	void submitModuleRejectsResubmission() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}}"
				+ "]}";
		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isOk());

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Phần làm bài này đã được nộp."));
	}

	@Test
	void submitModuleRejectsAnUnknownQuestion() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":99999999,\"content\":{\"selectedOptionIds\":[1]}}"
				+ "]}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy phần làm bài hoặc câu hỏi."));
	}

	@Test
	void submitModuleRejectsMissingOrEmptyAnswers() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Nội dung câu trả lời không hợp lệ."));

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"answers\":[]}")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Nội dung câu trả lời không hợp lệ."));
	}

	@Test
	void submitModuleRejectsMalformedQuizContent() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"text\":\"not a selection\"}}"
				+ "]}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Nội dung câu trả lời không hợp lệ."));
	}

	@Test
	void submitModuleRejectsDuplicateQuestionIds() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}},"
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[2]}}"
				+ "]}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Nội dung câu trả lời không hợp lệ."));
	}

	@Test
	void submitModuleRejectsAnotherStudentsModule() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}}"
				+ "]}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentOtherId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void submitModuleRejectsANonStudentCaller() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		long submissionModuleId = quizSubmissionModuleId(submissionId);
		String body = "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}}"
				+ "]}";

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@Test
	void submitModuleRejectsAnEssayModuleForNow() throws Exception {
		long submissionId = startSubmissionAsStudentMember();
		List<SubmissionModule> submissionModules = submissionModuleRepository.findBySubmissionId(submissionId);
		long essaySubmissionModuleId = submissionModules.stream()
				.filter(module -> module.getModuleId().equals(essayModuleId))
				.findFirst()
				.orElseThrow()
				.getId();

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", essaySubmissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}")
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Loại phần làm bài này chưa được hỗ trợ."));
	}

	private long startSubmissionAsStudentMember() throws Exception {
		String response = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return jsonLong(response, "id");
	}

	private long quizSubmissionModuleId(long submissionId) {
		return submissionModuleRepository.findBySubmissionId(submissionId).stream()
				.filter(module -> module.getModuleId().equals(quizModuleId))
				.findFirst()
				.orElseThrow()
				.getId();
	}

	private void grade(long submissionId) {
		Submission submission = submissionRepository.findById(submissionId).orElseThrow();
		submission.setSubmittedAt(OffsetDateTime.now());
		submission.setStatus(SubmissionStatus.GRADED);
		submissionRepository.save(submission);
		List<SubmissionModule> submissionModules = submissionModuleRepository.findBySubmissionId(submissionId);
		List<Long> submissionModuleIds = submissionModules.stream().map(SubmissionModule::getId).toList();
		for (SubmissionModule submissionModule : submissionModules) {
			submissionModule.setStatus(SubmissionStatus.GRADED);
			submissionModuleRepository.save(submissionModule);
		}
		List<Grading> gradings = gradingRepository.findBySubmissionModuleIds(submissionModuleIds);
		for (Grading grading : gradings) {
			grading.setStatus(GradingStatus.COMPLETED);
			grading.setFinalScore(BigDecimal.valueOf(8));
			grading.setMaxScoreSnapshot(BigDecimal.TEN);
			grading.setAiFeedback("Nhận xét AI");
			gradingRepository.save(grading);
		}
	}

	private void assertAttemptNumber(int expected) throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", publishedAssignmentId)
						.header("Authorization", bearer(studentMemberId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.attemptNumber").value(expected));
	}

	private long assignment(long classId, AssignmentStatus status, OffsetDateTime openAt, OffsetDateTime closeAt,
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