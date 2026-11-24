package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerAnnotationRepository;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingChangeLogRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtPrincipal;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.grading.application.service.GradingAiResultPersistenceService;
import com.english_hub.core.modules.grading.application.service.GradingService;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class GradingAiConcurrencyIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_grading_ai_concurrency_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final UserRepository userRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final ClassJpaRepository classRepository;
	private final AssignmentRepository assignmentRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final SubmissionRepository submissionRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final AnswerRepository answerRepository;
	private final GradingRepository gradingRepository;
	private final AnswerAnnotationRepository answerAnnotationRepository;
	private final GradingChangeLogRepository gradingChangeLogRepository;
	private final GradingService gradingService;
	private final GradingAiResultPersistenceService gradingAiResultPersistenceService;

	GradingAiConcurrencyIntegrationTest(
			UserRepository userRepository,
			StudentProfileRepository studentProfileRepository,
			TeacherProfileRepository teacherProfileRepository,
			ClassJpaRepository classRepository,
			AssignmentRepository assignmentRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			SubmissionRepository submissionRepository,
			SubmissionModuleRepository submissionModuleRepository,
			AnswerRepository answerRepository,
			GradingRepository gradingRepository,
			AnswerAnnotationRepository answerAnnotationRepository,
			GradingChangeLogRepository gradingChangeLogRepository,
			GradingService gradingService,
			GradingAiResultPersistenceService gradingAiResultPersistenceService) {
		this.userRepository = userRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.classRepository = classRepository;
		this.assignmentRepository = assignmentRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.submissionRepository = submissionRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.answerRepository = answerRepository;
		this.gradingRepository = gradingRepository;
		this.answerAnnotationRepository = answerAnnotationRepository;
		this.gradingChangeLogRepository = gradingChangeLogRepository;
		this.gradingService = gradingService;
		this.gradingAiResultPersistenceService = gradingAiResultPersistenceService;
	}

	private long teacherId;
	private long submissionModuleId;
	private long answerId;
	private long gradingId;

	@BeforeEach
	void setUp() {
		teacherId = createTeacher();
		long classId = classRepository.save(new ClassEntity(
				"AI race class " + UUID.randomUUID(),
				"Intermediate",
				"AI race integration fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
		long assignmentId = assignmentRepository.save(new Assignment(
				classId,
				"AI race assignment",
				"Concurrent grading fixture",
				OffsetDateTime.now().minusHours(1),
				OffsetDateTime.now().plusHours(24),
				1,
				false,
				AssignmentStatus.PUBLISHED)).getId();
		long moduleId = assignmentModuleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.WRITING,
				ModuleTaskType.ESSAY,
				1,
				"Write a short response",
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				"Evaluate clarity and grammar")).getId();
		long studentId = createStudent();
		Submission submission = submissionRepository.save(new Submission(
				assignmentId,
				studentId,
				1,
				OffsetDateTime.now(),
				SubmissionStatus.SUBMITTED));
		submissionModuleId = submissionModuleRepository.save(new SubmissionModule(
				submission.getId(), moduleId, SubmissionStatus.SUBMITTED)).getId();
		answerId = answerRepository.save(new Answer(
				submissionModuleId, null, "A committed answer used for race testing.",
				null, null, null, null, null, null, null, null, null)).getId();
		gradingId = gradingRepository.save(new Grading(
				submissionModuleId,
				GradingMethod.AUTO,
				GradingStatus.PENDING,
				null,
				null,
				null,
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				"AI instruction snapshot")).getId();
		authenticateAsTeacher();
	}

	@AfterEach
	void clearSecurityContext() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void teacherGradeWinsWhenAiResponseArrivesAfterManualCommit() throws Exception {
		CountDownLatch aiResponseReady = new CountDownLatch(1);
		CountDownLatch allowAiPersistence = new CountDownLatch(1);
		AnswerAnnotation aiAnnotation = AnswerAnnotation.ai(answerId, 0, 1, 1, "grammar", "AI comment", "AI fix");
		com.english_hub.core.modules.grading.domain.model.Grading aiResult = aiResult(new BigDecimal("7.00"));

		CompletableFuture<Void> aiWorker = CompletableFuture.runAsync(() -> {
			aiResponseReady.countDown();
			try {
				if (!allowAiPersistence.await(10, TimeUnit.SECONDS)) {
					throw new IllegalStateException("Timed out waiting for the manual grade commit.");
				}
				gradingAiResultPersistenceService.persistAiResult(aiResult, List.of(aiAnnotation));
			} catch (InterruptedException exception) {
				Thread.currentThread().interrupt();
				throw new IllegalStateException("AI race test interrupted.", exception);
			}
		});

		assertThat(aiResponseReady.await(5, TimeUnit.SECONDS)).isTrue();
		try {
			gradingService.updateFinalGrade(
					gradingId, new BigDecimal("9.25"), "Teacher feedback", "Manual grade wins");
		} finally {
			allowAiPersistence.countDown();
		}
		aiWorker.get(10, TimeUnit.SECONDS);

		Grading persisted = gradingRepository.findById(gradingId).orElseThrow();
		assertThat(persisted.getStatus()).isEqualTo(GradingStatus.COMPLETED);
		assertThat(persisted.getMethod()).isEqualTo(GradingMethod.TEACHER_MANUAL);
		assertThat(persisted.getFinalScore()).isEqualByComparingTo("9.25");
		assertThat(persisted.getFinalFeedback()).isEqualTo("Teacher feedback");
		assertThat(persisted.getAiFeedback()).isNull();
		assertThat(answerAnnotationRepository.findByAnswerIdOrderByIdAsc(answerId)).isEmpty();
		assertThat(gradingChangeLogRepository.findByGradingIdOrderByChangedAtDescIdDesc(gradingId)).hasSize(1);
	}

	@Test
	void persistAiResult_rollsBackGradeAndAnnotationsWhenAnnotationInsertFails() {
		com.english_hub.core.modules.grading.domain.model.Grading aiResult = aiResult(new BigDecimal("7.00"));
		String tooLongErrorType = "x".repeat(51);
		AnswerAnnotation invalidAnnotation = AnswerAnnotation.ai(
				answerId, 0, 1, 1, tooLongErrorType, "AI comment", "AI fix");

		assertThatThrownBy(() -> gradingAiResultPersistenceService.persistAiResult(aiResult, List.of(invalidAnnotation)))
				.isInstanceOf(RuntimeException.class);

		gradingAiResultPersistenceService.markFailedIfStillPending(submissionModuleId);

		Grading persisted = gradingRepository.findById(gradingId).orElseThrow();
		assertThat(persisted.getStatus()).isEqualTo(GradingStatus.FAILED);
		assertThat(persisted.getFinalScore()).isNull();
		assertThat(persisted.getAiFeedback()).isNull();
		assertThat(answerAnnotationRepository.findByAnswerIdOrderByIdAsc(answerId)).isEmpty();
	}

	private long createTeacher() {
		com.english_hub.core.modules.user.infrastructure.persistence.entity.User teacher = userRepository.save(
				new com.english_hub.core.modules.user.infrastructure.persistence.entity.User(
						"AI Race Teacher",
						"teacher." + UUID.randomUUID() + "@test.local",
						null,
						"test-hash",
						UserRole.TEACHER,
						UserStatus.ACTIVE,
						false));
		teacherProfileRepository.save(new com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile(
				teacher, "English"));
		return teacher.getId();
	}

	private long createStudent() {
		com.english_hub.core.modules.user.infrastructure.persistence.entity.User student = userRepository.save(
				new com.english_hub.core.modules.user.infrastructure.persistence.entity.User(
						"AI Race Student",
						"student." + UUID.randomUUID() + "@test.local",
						null,
						"test-hash",
						UserRole.STUDENT,
						UserStatus.ACTIVE,
						false));
		studentProfileRepository.save(new com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile(
				student,
				"AI-" + UUID.randomUUID().toString().substring(0, 10),
				LocalDate.of(2005, 2, 3),
				null));
		return student.getId();
	}

	private void authenticateAsTeacher() {
		var principal = new JwtPrincipal(
				teacherId,
				com.english_hub.core.modules.user.domain.model.UserRole.TEACHER);
		SecurityContextHolder.getContext().setAuthentication(
				new UsernamePasswordAuthenticationToken(principal, "integration-test", List.of()));
	}

	private com.english_hub.core.modules.grading.domain.model.Grading aiResult(BigDecimal score) {
		return new com.english_hub.core.modules.grading.domain.model.Grading(
				gradingId,
				submissionModuleId,
				com.english_hub.core.modules.grading.domain.model.GradingMethod.AUTO,
				com.english_hub.core.modules.grading.domain.model.GradingStatus.AI_GRADED,
				"AI feedback",
				score,
				"AI feedback",
				new BigDecimal("10.00"),
				null,
				null,
				OffsetDateTime.now(),
			null,
				null);
	}
}
