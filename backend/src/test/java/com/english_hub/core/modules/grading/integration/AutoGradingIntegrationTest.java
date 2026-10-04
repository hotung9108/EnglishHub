package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
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
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.application.port.StorageService.PresignedUpload;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataSubmissionModuleRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.math.BigDecimal;
import java.time.Duration;
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
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Covers the end-to-end auto-grading path, which is the one place the pieces only work together:
 * the submit transaction has to commit for the event to fire, the task has to run on another thread,
 * and the verdicts have to land in the answer rows.
 *
 * <p>Deliberately has no class-level {@code @Transactional}. That annotation rolls the test back at
 * the end, which also rolls back without committing, so {@code AFTER_COMMIT} would never fire and
 * every assertion here would pass against a grading that never ran.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Import(AutoGradingIntegrationTest.StubStorageConfiguration.class)
class AutoGradingIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_auto_grading_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired private MockMvc mockMvc;
	@Autowired private JwtTokenService jwtTokenService;
	@Autowired private UserRepository userRepository;
	@Autowired private TeacherProfileRepository teacherProfileRepository;
	@Autowired private StudentProfileRepository studentProfileRepository;
	@Autowired private ClassJpaRepository classRepository;
	@Autowired private ClassMemberRepository classMemberRepository;
	@Autowired private AssignmentRepository assignmentRepository;
	@Autowired private AssignmentModuleRepository assignmentModuleRepository;
	@Autowired private QuestionRepository questionRepository;
	@Autowired private SpringDataSubmissionModuleRepository submissionModuleRepository;
	@Autowired private AnswerRepository answerRepository;
	@Autowired private GradingRepository gradingRepository;
	@Autowired private ObjectMapper objectMapper;

	private long teacherId;
	private long studentId;
	private long classId;
	private long assignmentId;
	private long quizModuleId;
	private long rewriteModuleId;
	private long essayModuleId;
	private long quizQuestionOne;
	private long quizQuestionTwo;
	private long rewriteQuestionOne;

	@BeforeEach
	void setUp() {
		teacherId = createUser(UserRole.TEACHER, "Auto grading teacher");
		studentId = createUser(UserRole.STUDENT, "Auto grading student");
		teacherProfileRepository.save(new TeacherProfile(user(teacherId), "English"));
		studentProfileRepository.save(new StudentProfile(
				user(studentId),
				"AG-" + UUID.randomUUID().toString().substring(0, 10),
				LocalDate.of(2004, 3, 4),
				null));

		classId = classRepository.save(new ClassEntity(
				"Auto grading class " + UUID.randomUUID(),
				"Intermediate",
				"Auto grading integration fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentId));
		assignmentId = assignmentRepository.save(new Assignment(
				classId,
				"Auto grading assignment",
				"Deterministic auto grading of quiz and rewrite modules",
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(48),
				2,
				false,
				AssignmentStatus.PUBLISHED)).getId();

		quizModuleId = module(ModuleSkill.READING, ModuleTaskType.QUIZ, 1, "10.00");
		rewriteModuleId = module(ModuleSkill.READING, ModuleTaskType.REWRITE, 2, "5.00");
		essayModuleId = module(ModuleSkill.WRITING, ModuleTaskType.ESSAY, 3, "10.00");

		quizQuestionOne = choiceQuestion(quizModuleId, 1, 1, "1.00");
		quizQuestionTwo = choiceQuestion(quizModuleId, 2, 3, "1.00");
		rewriteQuestionOne = questionRepository.save(new Question(
						rewriteModuleId,
						"Complete the sentence with the correct word",
						QuestionType.SHORT_ANSWER,
						"{\"correctAnswer\":\"English\"}",
						new BigDecimal("5.00"),
						1))
				.getId();
	}

	@Test
	void scoresTheRightAnswersOnlyAndMarksTheModuleGraded() throws Exception {
		long submissionModuleId = submit(quizModuleId, "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}},"
				+ "{\"questionId\":" + quizQuestionTwo + ",\"content\":{\"selectedOptionIds\":[4]}}"
				+ "]}");

		Grading grading = awaitGrading(submissionModuleId);

		assertThat(grading.getStatus()).isEqualTo(GradingStatus.COMPLETED);
		assertThat(grading.getMethod()).isEqualTo(GradingMethod.AUTO);
		assertThat(grading.getFinalScore()).isEqualByComparingTo("1.00");
		assertThat(grading.getMaxScoreSnapshot()).isEqualByComparingTo("10.00");
		assertThat(grading.getGradedAt()).isNotNull();
		assertThat(grading.getReviewedBy()).isNull();
		assertThat(grading.getReviewedAt()).isNull();

		assertThat(submissionModule(submissionModuleId).getStatus()).isEqualTo(SubmissionStatus.GRADED);
	}

	@Test
	void mergesTheVerdictIntoEachAnswerRow() throws Exception {
		long submissionModuleId = submit(quizModuleId, "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}},"
				+ "{\"questionId\":" + quizQuestionTwo + ",\"content\":{\"selectedOptionIds\":[4]}}"
				+ "]}");

		awaitGrading(submissionModuleId);

		List<Answer> answers = answerRepository.findBySubmissionModuleId(submissionModuleId);
		assertThat(answers).hasSize(2);

		Answer correct = answerFor(answers, quizQuestionOne);
		assertThat(content(correct).get("isCorrect").booleanValue()).isTrue();
		assertThat(content(correct).get("score").decimalValue()).isEqualByComparingTo("1.00");
		assertThat(content(correct).get("selectedOptionIds").get(0).longValue()).isEqualTo(1L);

		Answer wrong = answerFor(answers, quizQuestionTwo);
		assertThat(content(wrong).get("isCorrect").booleanValue()).isFalse();
		assertThat(content(wrong).get("score").decimalValue()).isEqualByComparingTo("0.00");
	}

	@Test
	void scoresARewriteModuleTheSameWayAsAQuizModule() throws Exception {
		long submissionModuleId = submit(rewriteModuleId, "{\"answers\":["
				+ "{\"questionId\":" + rewriteQuestionOne + ",\"content\":{\"text\":\"English\"}}"
				+ "]}");

		Grading grading = awaitGrading(submissionModuleId);

		assertThat(grading.getStatus()).isEqualTo(GradingStatus.COMPLETED);
		assertThat(grading.getFinalScore()).isEqualByComparingTo("5.00");
		assertThat(grading.getMaxScoreSnapshot()).isEqualByComparingTo("5.00");
		assertThat(submissionModule(submissionModuleId).getStatus()).isEqualTo(SubmissionStatus.GRADED);
	}

	@Test
	void ignoresCaseAndWhitespaceInShortAnswers() throws Exception {
		long submissionModuleId = submit(rewriteModuleId, "{\"answers\":["
				+ "{\"questionId\":" + rewriteQuestionOne + ",\"content\":{\"text\":\"  english  \"}}"
				+ "]}");

		Grading grading = awaitGrading(submissionModuleId);

		assertThat(grading.getFinalScore()).isEqualByComparingTo("5.00");
	}

	@Test
	void scoresZeroWhenEveryAnswerIsWrong() throws Exception {
		long submissionModuleId = submit(quizModuleId, "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[2]}},"
				+ "{\"questionId\":" + quizQuestionTwo + ",\"content\":{\"selectedOptionIds\":[4]}}"
				+ "]}");

		Grading grading = awaitGrading(submissionModuleId);

		assertThat(grading.getFinalScore()).isEqualByComparingTo("0.00");
		assertThat(grading.getStatus()).isEqualTo(GradingStatus.COMPLETED);
	}

	@Test
	void leavesAnEssayModuleForTheTeacher() throws Exception {
		long submissionModuleId = submit(essayModuleId, "{}");

		await().atMost(Duration.ofSeconds(5)).untilAsserted(() -> {
			assertThat(submissionModule(submissionModuleId).getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
			assertThat(grading(submissionModuleId).getStatus()).isEqualTo(GradingStatus.PENDING);
			assertThat(grading(submissionModuleId).getFinalScore()).isNull();
		});
	}

	@Test
	void answersWithoutAResponseStillContributeNothingRatherThanFailing() throws Exception {
		long submissionModuleId = submit(quizModuleId, "{\"answers\":["
				+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}}"
				+ "]}");

		Grading grading = awaitGrading(submissionModuleId);

		assertThat(grading.getFinalScore()).isEqualByComparingTo("1.00");
		assertThat(answerRepository.findBySubmissionModuleId(submissionModuleId)).hasSize(1);
	}

	@Test
	void respondsToTheStudentBeforeGradingHasFinished() throws Exception {
		/* The submit response must not depend on scoring, so it carries no verdict at all. */
		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", quizSubmissionModuleId())
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"answers\":[{\"questionId\":" + quizQuestionOne
								+ ",\"content\":{\"selectedOptionIds\":[1]}}]}")
						.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("SUBMITTED"))
				.andExpect(jsonPath("$.answers[0].content.isCorrect").doesNotExist())
				.andReturn()
				.getResponse()
				.getContentAsString();

		assertThat(response).doesNotContain("isCorrect");
	}

	@Test
	void gradesOnlyTheModuleThatWasSubmitted() throws Exception {
		long submissionId = startSubmission();
		long quizSubmissionModuleId = submissionModuleIdOf(submissionId, quizModuleId);
		long rewriteSubmissionModuleId = rewriteSubmissionModuleId(submissionId);

		mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", quizSubmissionModuleId)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"answers\":["
								+ "{\"questionId\":" + quizQuestionOne + ",\"content\":{\"selectedOptionIds\":[1]}}]}")
						.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk());

		awaitGrading(quizSubmissionModuleId);

		assertThat(submissionModule(rewriteSubmissionModuleId).getStatus()).isEqualTo(SubmissionStatus.IN_PROGRESS);
		assertThat(grading(rewriteSubmissionModuleId).getStatus()).isEqualTo(GradingStatus.PENDING);
	}

	private long submit(long moduleId, String body) throws Exception {
		String response = mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", submissionModuleIdOf(moduleId))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body)
						.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();
		return jsonLong(response, "submissionModuleId");
	}

	private Grading awaitGrading(long submissionModuleId) {
		await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
				assertThat(grading(submissionModuleId).getStatus()).isEqualTo(GradingStatus.COMPLETED));
		return grading(submissionModuleId);
	}

	private Grading grading(long submissionModuleId) {
		return gradingRepository.findBySubmissionModuleId(submissionModuleId).orElseThrow();
	}

	private SubmissionModule submissionModule(long submissionModuleId) {
		return submissionModuleRepository.findById(submissionModuleId).orElseThrow();
	}

	private Answer answerFor(List<Answer> answers, long questionId) {
		return answers.stream()
				.filter(answer -> Long.valueOf(questionId).equals(answer.getQuestionId()))
				.findFirst()
				.orElseThrow();
	}

	private JsonNode content(Answer answer) {
		return objectMapper.readTree(answer.getContent());
	}

	private long submissionModuleIdOf(long moduleId) throws Exception {
		return submissionModuleIdOf(startSubmission(), moduleId);
	}

	private long submissionModuleIdOf(long submissionId, long moduleId) {
		return submissionModuleRepository.findBySubmissionId(submissionId).stream()
				.filter(module -> module.getModuleId().equals(moduleId))
				.findFirst()
				.orElseThrow()
				.getId();
	}

	private long rewriteSubmissionModuleId(long submissionId) {
		return submissionModuleRepository.findBySubmissionId(submissionId).stream()
				.filter(module -> module.getModuleId().equals(rewriteModuleId))
				.findFirst()
				.orElseThrow()
				.getId();
	}

	private long quizSubmissionModuleId() throws Exception {
		return submissionModuleIdOf(quizModuleId);
	}

	private long startSubmission() throws Exception {
		String response = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", assignmentId)
						.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andReturn()
				.getResponse()
				.getContentAsString();
		return jsonLong(response, "id");
	}

	private long module(ModuleSkill skill, ModuleTaskType taskType, int orderIndex, String maxScore) {
		return assignmentModuleRepository.save(new AssignmentModule(
						assignmentId,
						skill,
						taskType,
						orderIndex,
						"Complete the " + skill.name().toLowerCase() + " task",
						new BigDecimal(maxScore),
						null,
						null,
						null,
						null,
						null))
				.getId();
	}

	private long choiceQuestion(long moduleId, int orderIndex, int correctOptionId, String score) {
		return questionRepository.save(new Question(
						moduleId,
						"Which option is correct?",
						QuestionType.MULTIPLE_CHOICE,
						"{\"options\":["
								+ "{\"id\":" + correctOptionId + ",\"content\":\"Correct\",\"isCorrect\":true},"
								+ "{\"id\":" + (correctOptionId + 1) + ",\"content\":\"Wrong\",\"isCorrect\":false}]}",
						new BigDecimal(score),
						orderIndex))
				.getId();
	}

	private String bearer(long userId, UserRole role) {
		return "Bearer " + jwtTokenService.createAccessToken(
				userId,
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name()));
	}

	private long createUser(UserRole role, String fullName) {
		String suffix = UUID.randomUUID().toString().substring(0, 8);
		return userRepository.save(new User(
						fullName,
						role.name().toLowerCase() + "-" + suffix + "@englishhub.test",
						"0912345678",
						"hash",
						role,
						UserStatus.ACTIVE,
						false))
				.getId();
	}

	private User user(long userId) {
		return userRepository.findById(userId).orElseThrow();
	}

	private long jsonLong(String json, String field) {
		Matcher matcher = Pattern.compile("\"" + field + "\"\\s*:\\s*(\\d+)").matcher(json);
		if (!matcher.find()) {
			throw new IllegalStateException("Field not found in response: " + json);
		}
		return Long.parseLong(matcher.group(1));
	}

	/**
	 * Replaces the "storage not configured" fallback so essay and recording modules can actually be
	 * submitted here. Without it those modules answer 500 before auto-grading is ever reached.
	 */
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
