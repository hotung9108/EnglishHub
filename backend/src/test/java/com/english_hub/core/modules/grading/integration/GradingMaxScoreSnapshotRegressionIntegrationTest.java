package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.application.port.StorageService.PresignedUpload;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;
import static org.awaitility.Awaitility.await;

/**
 * Exercises snapshot creation, legacy repair, and teacher updates through the student and teacher APIs.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Import(GradingMaxScoreSnapshotRegressionIntegrationTest.StubStorageConfiguration.class)
class GradingMaxScoreSnapshotRegressionIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_grading_snapshot_repro_test")
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
	private final ClassJpaRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final AssignmentRepository assignmentRepository;
	private final AssignmentModuleRepository moduleRepository;
	private final QuestionRepository questionRepository;
	private final GradingRepository gradingRepository;
	private final JwtTokenService jwtTokenService;
	private final ObjectMapper objectMapper;

	@Autowired
	GradingMaxScoreSnapshotRegressionIntegrationTest(
			MockMvc mockMvc,
			UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository,
			StudentProfileRepository studentProfileRepository,
			ClassJpaRepository classRepository,
			ClassMemberRepository classMemberRepository,
			AssignmentRepository assignmentRepository,
			AssignmentModuleRepository moduleRepository,
			QuestionRepository questionRepository,
			GradingRepository gradingRepository,
			JwtTokenService jwtTokenService,
			ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.assignmentRepository = assignmentRepository;
		this.moduleRepository = moduleRepository;
		this.questionRepository = questionRepository;
		this.gradingRepository = gradingRepository;
		this.jwtTokenService = jwtTokenService;
		this.objectMapper = objectMapper;
	}

	private long teacherId;
	private long studentId;
	private long classId;

	@BeforeEach
	void setUp() {
		String suffix = UUID.randomUUID().toString().substring(0, 10);
		teacherId = createUser(UserRole.TEACHER, "Snapshot teacher " + suffix);
		studentId = createUser(UserRole.STUDENT, "Snapshot student " + suffix);
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "English"));
		studentProfileRepository.save(new StudentProfile(
				user(studentId), "GS-" + suffix, LocalDate.of(2004, 3, 4), null));

		classId = classRepository.save(new ClassEntity(
				"Snapshot class " + suffix,
				"Intermediate",
				"Grading max score snapshot reproduction",
				LocalDate.now().minusDays(1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentId));
	}

	@Test
	void teacherManualWritingAttemptStoresSnapshotAndAcceptsValidScore() throws Exception {
		long assignmentId = createAssignment();
		long moduleId = createModule(assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY);
		Attempt attempt = startAttempt(assignmentId);
		Grading grading = gradingFor(attempt.submissionModuleId());

		assertThat(grading.getMethod()).isEqualTo(GradingMethod.TEACHER_MANUAL);
		assertThat(grading.getMaxScoreSnapshot()).as("snapshot immediately after start attempt")
				.isEqualByComparingTo("10.00");
		printSnapshot("MANUAL_AFTER_START", grading);

		// The student submits the writing module through the real endpoint. The test storage adapter
		// reports the uploaded document as present so the API can finish its normal submission path.
		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", attempt.submissionModuleId())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{}")
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
		mockMvc.perform(post("/api/v1/submissions/{id}/submit", attempt.submissionId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

		grading = gradingFor(attempt.submissionModuleId());
		assertThat(grading.getMaxScoreSnapshot()).as("snapshot after module and attempt submission")
				.isEqualByComparingTo("10.00");
		printSnapshot("MANUAL_AFTER_SUBMIT", grading);

		MvcResult putResult = mockMvc.perform(put("/api/v1/gradings/{id}", grading.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"finalScore\":6,\"finalFeedback\":\"Manual reproduction\",\"note\":\"BE-32\"}"))
				.andReturn();
		int httpStatus = putResult.getResponse().getStatus();
		String responseBody = putResult.getResponse().getContentAsString();
		System.out.printf("MANUAL_PUT gradingId=%d status=%d body=%s%n", grading.getId(), httpStatus, responseBody);

		assertThat(httpStatus)
				.as("Expected valid teacher score 6/10 to be accepted; actual response body: %s", responseBody)
				.isEqualTo(200);
		Grading updated = gradingFor(attempt.submissionModuleId());
		assertThat(updated.getFinalScore()).isEqualByComparingTo("6.00");
		assertThat(updated.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
	}

	@Test
	void autoReadingGradingHasSnapshotAtStartAndAfterAutoGrade() throws Exception {
		long assignmentId = createAssignment();
		long moduleId = createModule(assignmentId, ModuleSkill.READING, ModuleTaskType.QUIZ);
		long questionId = questionRepository.save(new Question(
				moduleId,
				"Choose the correct answer",
				QuestionType.MULTIPLE_CHOICE,
				"{\"options\":[{\"id\":1,\"content\":\"Correct\",\"isCorrect\":true},"
						+ "{\"id\":2,\"content\":\"Wrong\",\"isCorrect\":false}]}",
				new BigDecimal("10.00"),
				1)).getId();

		Attempt attempt = startAttempt(assignmentId);
		Grading grading = gradingFor(attempt.submissionModuleId());
		assertThat(grading.getMethod()).isEqualTo(GradingMethod.AUTO);
		assertThat(grading.getMaxScoreSnapshot()).as("AUTO snapshot immediately after start attempt")
				.isEqualByComparingTo("10.00");
		printSnapshot("AUTO_AFTER_START", grading);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", attempt.submissionModuleId())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"answers\":[{\"questionId\":" + questionId
							+ ",\"content\":{\"selectedOptionIds\":[1]}}]}")
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

		grading = awaitCompletedGrading(attempt.submissionModuleId());
		assertThat(grading.getMaxScoreSnapshot()).as("AUTO snapshot after module submit and auto-grade")
				.isEqualByComparingTo("10.00");
		printSnapshot("AUTO_AFTER_AUTO_GRADE", grading);

		mockMvc.perform(post("/api/v1/submissions/{id}/submit", attempt.submissionId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());

		MvcResult putResult = mockMvc.perform(put("/api/v1/gradings/{id}", grading.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"finalScore\":6,\"finalFeedback\":\"AUTO control\",\"note\":\"BE-32 control\"}"))
				.andReturn();
		String responseBody = putResult.getResponse().getContentAsString();
		System.out.printf("AUTO_CONTROL_PUT gradingId=%d status=%d body=%s%n",
				grading.getId(), putResult.getResponse().getStatus(), responseBody);
		assertThat(putResult.getResponse().getStatus())
				.as("AUTO grading has snapshot 10 and should accept 6; body: %s", responseBody)
				.isEqualTo(200);
		assertThat(gradingFor(attempt.submissionModuleId()).getFinalScore()).isEqualByComparingTo("6.00");
		assertThat(gradingFor(attempt.submissionModuleId()).getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
	}

	@Test
	void legacyNullSnapshotIsFilledOnValidPutAndUsedForSecondPut() throws Exception {
		long assignmentId = createAssignment();
		createModule(assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY);
		Attempt attempt = startAttempt(assignmentId);
		Grading grading = setSnapshotNull(gradingFor(attempt.submissionModuleId()));
		assertThat(grading.getMaxScoreSnapshot()).isNull();

		MvcResult firstPut = putScore(grading.getId(), "6");
		assertThat(firstPut.getResponse().getStatus()).as(firstPut.getResponse().getContentAsString()).isEqualTo(200);
		Grading afterFirstPut = gradingFor(attempt.submissionModuleId());
		assertThat(afterFirstPut.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
		assertThat(afterFirstPut.getFinalScore()).isEqualByComparingTo("6.00");

		MvcResult secondPut = putScore(grading.getId(), "8");
		assertThat(secondPut.getResponse().getStatus()).as(secondPut.getResponse().getContentAsString()).isEqualTo(200);
		Grading afterSecondPut = gradingFor(attempt.submissionModuleId());
		assertThat(afterSecondPut.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
		assertThat(afterSecondPut.getFinalScore()).isEqualByComparingTo("8.00");
	}

	@Test
	void legacyNullSnapshotRejectsInvalidScoresWithoutFillingSnapshot() throws Exception {
		long assignmentId = createAssignment();
		createModule(assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY);
		Attempt attempt = startAttempt(assignmentId);
		Grading grading = setSnapshotNull(gradingFor(attempt.submissionModuleId()));

		MvcResult aboveMaximum = putScore(grading.getId(), "11");
		assertThat(aboveMaximum.getResponse().getStatus()).as(aboveMaximum.getResponse().getContentAsString())
				.isEqualTo(400);
		assertThat(gradingFor(attempt.submissionModuleId()).getMaxScoreSnapshot()).isNull();

		MvcResult negative = putScore(grading.getId(), "-1");
		assertThat(negative.getResponse().getStatus()).as(negative.getResponse().getContentAsString()).isEqualTo(400);
		assertThat(gradingFor(attempt.submissionModuleId()).getMaxScoreSnapshot()).isNull();
	}

	@Test
	void legacyNullSnapshotAcceptsBothInclusiveScoreBounds() throws Exception {
		long assignmentId = createAssignment();
		createModule(assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY);
		Attempt maximumAttempt = startAttempt(assignmentId);
		Grading maximumGrading = setSnapshotNull(gradingFor(maximumAttempt.submissionModuleId()));
		MvcResult maximumPut = putScore(maximumGrading.getId(), "10");
		assertThat(maximumPut.getResponse().getStatus()).as(maximumPut.getResponse().getContentAsString()).isEqualTo(200);
		assertThat(gradingFor(maximumAttempt.submissionModuleId()).getMaxScoreSnapshot()).isEqualByComparingTo("10.00");

		Attempt zeroAttempt = startAttempt(assignmentId);
		Grading zeroGrading = setSnapshotNull(gradingFor(zeroAttempt.submissionModuleId()));
		MvcResult zeroPut = putScore(zeroGrading.getId(), "0");
		assertThat(zeroPut.getResponse().getStatus()).as(zeroPut.getResponse().getContentAsString()).isEqualTo(200);
		assertThat(gradingFor(zeroAttempt.submissionModuleId()).getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
	}

	@Test
	void secondAttemptGetsItsOwnSnapshot() throws Exception {
		long assignmentId = createAssignment();
		createModule(assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY);
		Attempt firstAttempt = startAttempt(assignmentId);
		Grading firstGrading = gradingFor(firstAttempt.submissionModuleId());
		assertThat(firstGrading.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");

		Attempt secondAttempt = startAttempt(assignmentId);
		Grading secondGrading = gradingFor(secondAttempt.submissionModuleId());
		assertThat(secondAttempt.submissionId()).isNotEqualTo(firstAttempt.submissionId());
		assertThat(secondGrading.getId()).isNotEqualTo(firstGrading.getId());
		assertThat(secondGrading.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
	}

	@Test
	void existingAutoGradeSnapshotIsNotReplacedWhenModuleMaxScoreChanges() throws Exception {
		long assignmentId = createAssignment();
		long moduleId = createModule(assignmentId, ModuleSkill.READING, ModuleTaskType.QUIZ);
		long questionId = questionRepository.save(new Question(
				moduleId,
				"Choose the correct answer",
				QuestionType.MULTIPLE_CHOICE,
				"{\"options\":[{\"id\":1,\"content\":\"Correct\",\"isCorrect\":true},"
						+ "{\"id\":2,\"content\":\"Wrong\",\"isCorrect\":false}]}",
				new BigDecimal("10.00"),
				1)).getId();
		Attempt attempt = startAttempt(assignmentId);
		Grading grading = gradingFor(attempt.submissionModuleId());
		assertThat(grading.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", attempt.submissionModuleId())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"answers\":[{\"questionId\":" + questionId
							+ ",\"content\":{\"selectedOptionIds\":[1]}}]}")
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
		grading = awaitCompletedGrading(attempt.submissionModuleId());
		assertThat(grading.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");

		AssignmentModule module = moduleRepository.findById(moduleId).orElseThrow();
		module.updateDetails(module.getOrderIndex(), module.getInstructions(), new BigDecimal("12.00"), module.getAiInstruction());
		moduleRepository.saveAndFlush(module);

		MvcResult aboveSnapshot = putScore(grading.getId(), "11");
		assertThat(aboveSnapshot.getResponse().getStatus()).as(aboveSnapshot.getResponse().getContentAsString())
				.isEqualTo(400);
		assertThat(gradingFor(attempt.submissionModuleId()).getMaxScoreSnapshot()).isEqualByComparingTo("10.00");

		MvcResult validScore = putScore(grading.getId(), "6");
		assertThat(validScore.getResponse().getStatus()).as(validScore.getResponse().getContentAsString()).isEqualTo(200);
		assertThat(gradingFor(attempt.submissionModuleId()).getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
	}

	@Test
	void zeroModuleMaxScoreAllowsAttemptButPutCannotFallbackToIt() throws Exception {
		long assignmentId = createAssignment();
		createModule(assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY, BigDecimal.ZERO);
		Attempt attempt = startAttempt(assignmentId);
		Grading grading = gradingFor(attempt.submissionModuleId());
		assertThat(grading.getMaxScoreSnapshot()).isNull();

		MvcResult putResult = putScore(grading.getId(), "0");
		assertThat(putResult.getResponse().getStatus()).as(putResult.getResponse().getContentAsString()).isEqualTo(400);
		Grading unchanged = gradingFor(attempt.submissionModuleId());
		assertThat(unchanged.getMaxScoreSnapshot()).isNull();
		assertThat(unchanged.getFinalScore()).isNull();
	}

	private long createAssignment() {
		return assignmentRepository.save(new Assignment(
				classId,
				"Snapshot assignment " + UUID.randomUUID(),
				"Assignment for live grading reproduction",
				OffsetDateTime.now().minusMinutes(10),
				OffsetDateTime.now().plusHours(3),
				2,
				false,
				AssignmentStatus.PUBLISHED)).getId();
	}

	private long createModule(long assignmentId, ModuleSkill skill, ModuleTaskType taskType) {
		return createModule(assignmentId, skill, taskType, new BigDecimal("10.00"));
	}

	private long createModule(long assignmentId, ModuleSkill skill, ModuleTaskType taskType, BigDecimal maxScore) {
		return moduleRepository.save(new AssignmentModule(
				assignmentId,
				skill,
				taskType,
				1,
				"Complete " + skill.name().toLowerCase() + " task",
				maxScore,
				null,
				null,
				null,
				null,
				null)).getId();
	}

	private Attempt startAttempt(long assignmentId) throws Exception {
		String response = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", assignmentId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();
		var json = objectMapper.readTree(response);
		return new Attempt(json.get("id").asLong(), json.get("modules").get(0).get("id").asLong());
	}

	private Grading gradingFor(long submissionModuleId) {
		return gradingRepository.findBySubmissionModuleId(submissionModuleId).orElseThrow();
	}

	private Grading setSnapshotNull(Grading grading) {
		ReflectionTestUtils.setField(grading, "maxScoreSnapshot", null);
		gradingRepository.saveAndFlush(grading);
		return gradingFor(grading.getSubmissionModuleId());
	}

	private MvcResult putScore(long gradingId, String score) throws Exception {
		return mockMvc.perform(put("/api/v1/gradings/{id}", gradingId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"finalScore\":" + score
							+ ",\"finalFeedback\":\"Regression test\",\"note\":\"BE-32\"}"))
				.andReturn();
	}

	private Grading awaitCompletedGrading(long submissionModuleId) {
		await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
				assertThat(gradingFor(submissionModuleId).getStatus()).isEqualTo(GradingStatus.COMPLETED));
		return gradingFor(submissionModuleId);
	}

	private void printSnapshot(String scenario, Grading grading) {
		System.out.printf("%s gradingId=%d method=%s status=%s maxScoreSnapshot=%s%n",
				scenario,
				grading.getId(),
				grading.getMethod(),
				grading.getStatus(),
				grading.getMaxScoreSnapshot());
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

	private record Attempt(long submissionId, long submissionModuleId) {
	}

	@TestConfiguration
	static class StubStorageConfiguration {

		@Bean
		StorageService storageService() {
			return new StorageService() {

				@Override
				public PresignedUpload generatePresignedPutUrl(String storageKey, String contentType) {
					return new PresignedUpload(storageKey, "https://storage.test/" + storageKey,
							OffsetDateTime.now().plusHours(1));
				}

				@Override
				public boolean objectExists(String storageKey) {
					return true;
				}
			};
		}
	}
}
