package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingChangeLog;
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.ReviewStatus;
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
import com.english_hub.core.infrastructure.security.JwtPrincipal;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.grading.application.service.GradingService;
import com.english_hub.core.modules.grading.domain.model.AnnotationSource;
import com.english_hub.core.modules.grading.domain.model.GradingFilter;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.grading.infrastructure.mapper.GradingPersistenceMapper;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@Transactional
class GradingPersistenceIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_grading_persistence_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired private UserRepository userJpaRepository;
	@Autowired private TeacherProfileRepository teacherProfileRepository;
	@Autowired private StudentProfileRepository studentProfileRepository;
	@Autowired private ClassJpaRepository classJpaRepository;
	@Autowired private AssignmentRepository assignmentJpaRepository;
	@Autowired private AssignmentModuleRepository assignmentModuleRepository;
	@Autowired private SubmissionRepository submissionJpaRepository;
	@Autowired private SubmissionModuleRepository submissionModuleRepository;
	@Autowired private AnswerRepository answerJpaRepository;
	@Autowired private GradingRepository gradingJpaRepository;
	@Autowired private AnswerAnnotationRepository annotationJpaRepository;
	@Autowired private GradingChangeLogRepository changeLogJpaRepository;
	@Autowired private GradingContextRepository gradingContextRepository;
	@Autowired private com.english_hub.core.modules.grading.domain.repository.GradingRepository gradingRepository;
	@Autowired private GradingPersistenceMapper mapper;
	@Autowired private GradingService gradingService;

	private long teacherOneId;
	private long teacherTwoId;
	private long studentOneId;
	private long studentTwoId;
	private long classOneId;
	private long classTwoId;
	private long pendingGradingId;
	private long pendingAnswerId;
	private long pendingSubmissionModuleId;
	private List<Long> classOneGradingIds;

	@BeforeEach
	void setUp() {
		teacherOneId = createUser(UserRole.TEACHER, "Teacher One");
		teacherTwoId = createUser(UserRole.TEACHER, "Teacher Two");
		studentOneId = createUser(UserRole.STUDENT, "Student One");
		studentTwoId = createUser(UserRole.STUDENT, "Student Two");
		teacherProfileRepository.save(new TeacherProfile(user(teacherOneId), "English"));
		teacherProfileRepository.save(new TeacherProfile(user(teacherTwoId), "English"));
		studentProfileRepository.save(new StudentProfile(
				user(studentOneId), "G-" + UUID.randomUUID().toString().substring(0, 10), LocalDate.of(2004, 1, 2), null));
		studentProfileRepository.save(new StudentProfile(
				user(studentTwoId), "G-" + UUID.randomUUID().toString().substring(0, 10), LocalDate.of(2005, 2, 3), null));

		classOneId = createClass(teacherOneId, "Class One");
		classTwoId = createClass(teacherTwoId, "Class Two");
		long assignmentOneId = createAssignment(classOneId, "Assignment One");
		long assignmentTwoId = createAssignment(classTwoId, "Assignment Two");
		long moduleOneId = createModule(assignmentOneId);
		long moduleTwoId = createModule(assignmentTwoId);

		pendingSubmissionModuleId = createSubmissionModule(
				assignmentOneId, moduleOneId, studentOneId, 1, SubmissionStatus.SUBMITTED);
		long aiGradedSubmissionModuleId = createSubmissionModule(
				assignmentOneId, moduleOneId, studentOneId, 2, SubmissionStatus.SUBMITTED);
		long completedSubmissionModuleId = createSubmissionModule(
				assignmentOneId, moduleOneId, studentTwoId, 1, SubmissionStatus.GRADED);
		long otherClassSubmissionModuleId = createSubmissionModule(
				assignmentTwoId, moduleTwoId, studentOneId, 3, SubmissionStatus.SUBMITTED);

		pendingAnswerId = createAnswer(pendingSubmissionModuleId);
		createAnswer(aiGradedSubmissionModuleId);
		createAnswer(completedSubmissionModuleId);
		createAnswer(otherClassSubmissionModuleId);

		pendingGradingId = createGrading(pendingSubmissionModuleId, GradingMethod.AUTO, GradingStatus.PENDING);
		long aiGradedId = createGrading(aiGradedSubmissionModuleId, GradingMethod.AUTO, GradingStatus.AI_GRADED);
		long completedId = createGrading(
				completedSubmissionModuleId, GradingMethod.TEACHER_MANUAL, GradingStatus.COMPLETED);
		createGrading(otherClassSubmissionModuleId, GradingMethod.TEACHER_MANUAL, GradingStatus.FAILED);
		classOneGradingIds = List.of(pendingGradingId, aiGradedId, completedId);
	}

	@AfterEach
	void clearSecurityContext() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void gradingIdAndAnswerIdResolveTheTeacherThroughTheScalarIdChain() {
		var gradingContext = gradingContextRepository.findByGradingId(pendingGradingId).orElseThrow();
		var answerContext = gradingContextRepository.findByAnswerId(pendingAnswerId).orElseThrow();

		assertThat(gradingContext.teacherId()).isEqualTo(teacherOneId);
		assertThat(answerContext.teacherId()).isEqualTo(teacherOneId);
		assertThat(gradingContext.classId()).isEqualTo(classOneId);
		assertThat(answerContext.answerId()).isEqualTo(pendingAnswerId);
	}

	@Test
	void gradingFiltersAndPaginationReturnTheExpectedRows() {
		GradingPage firstPage = gradingRepository.findPage(
				new GradingFilter(classOneId, null, null, null), 1, 1);
		GradingPage secondPage = gradingRepository.findPage(
				new GradingFilter(classOneId, null, null, null), 2, 1);
		GradingPage filtered = gradingRepository.findPage(
				new GradingFilter(classOneId, studentOneId,
						com.english_hub.core.modules.grading.domain.model.GradingStatus.PENDING, null),
				1,
				20);

		assertThat(firstPage.getTotalElements()).isEqualTo(3);
		assertThat(firstPage.getSize()).isEqualTo(1);
		assertThat(firstPage.getContent()).hasSize(1);
		assertThat(secondPage.getContent()).hasSize(1);
		assertThat(firstPage.getContent().get(0).id()).isNotEqualTo(secondPage.getContent().get(0).id());
		assertThat(filtered.getContent()).extracting("id").containsExactly(pendingGradingId);
		assertThat(classOneGradingIds).contains(pendingGradingId);
	}

	@Test
	void persistenceMapperRoundTripsGradingAndAnnotationEnums() {
		List<Grading> persistedGradings = gradingJpaRepository.findAll();
		assertThat(persistedGradings).hasSize(4);
		assertThat(persistedGradings).allSatisfy(entity -> {
			var domain = mapper.toDomain(entity);
			assertThat(domain.method().name()).isEqualTo(entity.getMethod().name());
			assertThat(domain.status().name()).isEqualTo(entity.getStatus().name());
		});
		assertThat(persistedGradings).extracting(Grading::getStatus)
				.containsExactlyInAnyOrder(
						GradingStatus.PENDING,
						GradingStatus.AI_GRADED,
						GradingStatus.COMPLETED,
						GradingStatus.FAILED);
		assertThat(persistedGradings).extracting(Grading::getMethod)
				.containsExactlyInAnyOrder(GradingMethod.AUTO, GradingMethod.AUTO,
						GradingMethod.TEACHER_MANUAL, GradingMethod.TEACHER_MANUAL);

		var answer = answerJpaRepository.findById(pendingAnswerId).orElseThrow();
		for (AnnotationSource source : AnnotationSource.values()) {
			for (ReviewStatus reviewStatus : ReviewStatus.values()) {
				var domain = (source == AnnotationSource.TEACHER
						? com.english_hub.core.modules.grading.domain.model.AnswerAnnotation.teacher(
								answer.getId(), 0, 1, null, "grammar", "comment", "fix")
						: com.english_hub.core.modules.grading.domain.model.AnswerAnnotation.ai(
								answer.getId(), 0, 1, null, "grammar", "comment", "fix"))
						.withReviewStatus(com.english_hub.core.modules.grading.domain.model.ReviewStatus.valueOf(
								reviewStatus.name()));
				var entity = mapper.toNewEntity(domain);
				assertThat(entity.getSource().name()).isEqualTo(source.name());
				assertThat(entity.getReviewStatus().name()).isEqualTo(reviewStatus.name());
				var saved = annotationJpaRepository.saveAndFlush(entity);
				var restored = mapper.toDomain(saved);
				assertThat(restored.source().name()).isEqualTo(source.name());
				assertThat(restored.reviewStatus().name()).isEqualTo(reviewStatus.name());
			}
		}
		assertThat(annotationJpaRepository.findByAnswerIdOrderByIdAsc(answer.getId())).hasSize(6);
	}

	@Test
	void changedScoreWritesChangeLogButEqualScoresAndFeedbackOnlyDoNot() {
		authenticateAs(teacherOneId);
		gradingService.updateFinalGrade(pendingGradingId, new BigDecimal("8.00"), "First feedback", "score changed");
		gradingJpaRepository.flush();
		assertThat(changeLogJpaRepository.findByGradingIdOrderByChangedAtDescIdDesc(pendingGradingId))
				.hasSize(1);
		assertThat(gradingJpaRepository.findById(pendingGradingId).orElseThrow().getStatus())
				.isEqualTo(GradingStatus.COMPLETED);

		gradingService.updateFinalGrade(pendingGradingId, new BigDecimal("8.0"), "First feedback", "same numeric score");
		gradingService.updateFinalGrade(pendingGradingId, new BigDecimal("8.000"), "Feedback only", "feedback changed");
		gradingJpaRepository.flush();
		assertThat(changeLogJpaRepository.findByGradingIdOrderByChangedAtDescIdDesc(pendingGradingId))
				.hasSize(1);
		assertThat(gradingJpaRepository.findById(pendingGradingId).orElseThrow().getFinalFeedback())
				.isEqualTo("Feedback only");
	}

	private long createUser(UserRole role, String name) {
		User saved = userJpaRepository.save(new User(
				name,
				name.toLowerCase().replace(' ', '.') + "." + UUID.randomUUID() + "@test.local",
				null,
				"test-hash",
				role,
				UserStatus.ACTIVE,
				false));
		return saved.getId();
	}

	private User user(long id) {
		return userJpaRepository.findById(id).orElseThrow();
	}

	private long createClass(long teacherId, String name) {
		return classJpaRepository.save(new ClassEntity(
				name + " " + UUID.randomUUID(),
				"Intermediate",
				"Grading integration fixture",
				LocalDate.of(2026, 9, 1),
				null,
				ClassStatus.ACTIVE,
				teacherId)).getId();
	}

	private long createAssignment(long classId, String name) {
		return assignmentJpaRepository.save(new Assignment(
				classId,
				name,
				"Fixture assignment",
				OffsetDateTime.parse("2026-09-01T00:00:00Z"),
				OffsetDateTime.parse("2026-09-30T00:00:00Z"),
				4,
				false,
				AssignmentStatus.PUBLISHED)).getId();
	}

	private long createModule(long assignmentId) {
		return assignmentModuleRepository.save(new AssignmentModule(
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
				"Review answer quality")).getId();
	}

	private long createSubmissionModule(
		long assignmentId,
		long moduleId,
		long studentId,
		int attempt,
		SubmissionStatus status) {
		Submission submission = submissionJpaRepository.save(new Submission(
				assignmentId,
				studentId,
				attempt,
				OffsetDateTime.parse("2026-09-15T12:00:00Z"),
				status));
		return submissionModuleRepository.save(new SubmissionModule(
				submission.getId(), moduleId, status)).getId();
	}

	private long createAnswer(long submissionModuleId) {
		return answerJpaRepository.save(new Answer(
				submissionModuleId, null, "A realistic answer for the grading context.",
				null, null, null, null, null, null, null, null, null)).getId();
	}

	private long createGrading(long submissionModuleId, GradingMethod method, GradingStatus status) {
		return gradingJpaRepository.save(new Grading(
				submissionModuleId,
				method,
				status,
				null,
				null,
				null,
				new BigDecimal("10.00"),
				null,
				null,
				null,
				null,
				"AI instruction snapshot")).getId();
	}

	private void authenticateAs(long userId) {
		var principal = new JwtPrincipal(
				userId,
				com.english_hub.core.modules.user.domain.model.UserRole.TEACHER);
		SecurityContextHolder.getContext().setAuthentication(
				new UsernamePasswordAuthenticationToken(principal, "integration-test", List.of()));
	}
}
