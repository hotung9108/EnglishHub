package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.awaitility.Awaitility.await;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
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
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtPrincipal;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.grading.application.event.AutoGradingAsyncWorker;
import com.english_hub.core.modules.submission.application.service.SubmissionService;
import com.english_hub.core.modules.submission.domain.event.SubmissionModuleSubmittedEvent;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataSubmissionModuleRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import org.aopalliance.intercept.MethodInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.aop.framework.Advised;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Import;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.http.MediaType;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.util.AopTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.ObjectMapper;

/** Real commits are required: the production listener runs only after a successful commit. */
@Testcontainers
@SpringBootTest(properties = {"spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@MockitoSpyBean(types = AutoGradingAsyncWorker.class)
@Import({FinalSubmitAutoGradingIntegrationTest.Fixture.class, FinalSubmitAutoGradingIntegrationTest.PublishedEvents.class})
class FinalSubmitAutoGradingIntegrationTest {

	private static final Duration TIMEOUT = Duration.ofSeconds(10);

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_final_submit_test").withUsername("test").withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final Fixture fixture;
	private final AutoGradingAsyncWorker worker;
	private final AutoGradingAsyncWorker workerProxy;
	private final ThreadPoolTaskExecutor executor;
	private final PublishedEvents events;
	private final SubmissionService submissionService;
	private final TransactionTemplate transaction;
	private final ApplicationEventPublisher publisher;

	FinalSubmitAutoGradingIntegrationTest(
			Fixture fixture, AutoGradingAsyncWorker worker,
			@Qualifier("autoGradingExecutor") ThreadPoolTaskExecutor executor,
			PublishedEvents events, SubmissionService submissionService,
			PlatformTransactionManager transactionManager, ApplicationEventPublisher publisher) {
		this.fixture = fixture;
		this.worker = AopTestUtils.getUltimateTargetObject(worker);
		this.workerProxy = worker;
		this.executor = executor;
		this.events = events;
		this.submissionService = submissionService;
		this.transaction = new TransactionTemplate(transactionManager);
		this.publisher = publisher;
	}

	@BeforeEach
	void setUp() {
		awaitExecutorIdle();
		reset(worker);
		events.clear();
		fixture.create();
	}

	// Before BE-66: FAIL because neither final-submit event is published.
	@Test
	void completesBlankReadingAndListeningModulesWithZero() throws Exception {
		long reading = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		long listening = fixture.module(ModuleSkill.LISTENING, ModuleTaskType.QUIZ);
		fixture.choiceQuestion(reading, 1);
		fixture.choiceQuestion(listening, 1);
		fixture.start();
		List<Long> gradingIds = fixture.gradingIds();

		fixture.finalSubmit();

		awaitCompleted(fixture.submissionModuleId(reading), "0");
		awaitCompleted(fixture.submissionModuleId(listening), "0");
		assertThat(fixture.answers()).isEmpty();
		assertThat(fixture.gradingIds()).isEqualTo(gradingIds);
		assertEvents(fixture.submissionModuleId(reading), fixture.submissionModuleId(listening));
	}

	// Before BE-66: FAIL for both eligible QUIZ skills.
	@ParameterizedTest
	@EnumSource(value = ModuleSkill.class, names = {"READING", "LISTENING"})
	void gradesAnswersPersistedWhileTheQuizModuleIsInProgress(ModuleSkill skill) throws Exception {
		long moduleId = fixture.module(skill, ModuleTaskType.QUIZ);
		long correctQuestion = fixture.choiceQuestion(moduleId, 1);
		long wrongQuestion = fixture.choiceQuestion(moduleId, 2);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		fixture.answer(module, correctQuestion, "{\"selectedOptionIds\":[1]}");
		fixture.answer(module, wrongQuestion, "{\"selectedOptionIds\":[2]}");
		assertThat(fixture.submissionModule(module).getStatus()).isEqualTo(SubmissionStatus.IN_PROGRESS);

		fixture.finalSubmit();

		awaitCompleted(module, "1");
		List<Answer> answers = fixture.answers();
		assertThat(answers).hasSize(2);
		assertThat(fixture.objectMapper.readTree(answers.get(0).getContent()).get("isCorrect").asBoolean()).isTrue();
		assertThat(fixture.objectMapper.readTree(answers.get(1).getContent()).get("isCorrect").asBoolean()).isFalse();
		assertEvents(module);
	}

	// Before BE-66: FAIL because the REWRITE module never reaches the grader.
	@Test
	void gradesAReadingRewriteAfterFinalSubmit() throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.REWRITE);
		long questionId = fixture.rewriteQuestion(moduleId);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		fixture.answer(module, questionId, "{\"text\":\"  english  \"}");

		fixture.finalSubmit();

		awaitCompleted(module, "5");
		assertEvents(module);
	}

	// Before BE-66: FAIL on the AUTO modules; the manual rows already exist at attempt start.
	@Test
	void gradesOnlyAutoModulesAndPreservesTheManualGradings() throws Exception {
		long reading = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		long listening = fixture.module(ModuleSkill.LISTENING, ModuleTaskType.QUIZ);
		long writing = fixture.module(ModuleSkill.WRITING, ModuleTaskType.ESSAY);
		long speaking = fixture.module(ModuleSkill.SPEAKING, ModuleTaskType.RECORDING);
		fixture.start();
		List<Long> gradingIds = fixture.gradingIds();
		String writingBefore = fixture.gradingSnapshot(fixture.submissionModuleId(writing));
		String speakingBefore = fixture.gradingSnapshot(fixture.submissionModuleId(speaking));

		fixture.finalSubmit();

		awaitCompleted(fixture.submissionModuleId(reading), "0");
		awaitCompleted(fixture.submissionModuleId(listening), "0");
		assertManualUnchanged(fixture.submissionModuleId(writing), writingBefore);
		assertManualUnchanged(fixture.submissionModuleId(speaking), speakingBefore);
		assertThat(fixture.gradingIds()).isEqualTo(gradingIds);
		assertEvents(fixture.submissionModuleId(reading), fixture.submissionModuleId(listening));
	}

	// Before BE-66: FAIL while waiting for the first final submit to finish grading.
	@Test
	void rejectsRepeatedFinalSubmitWithoutChangingResultsOrPublishingAgain() throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		fixture.finalSubmit();
		awaitCompleted(module, "0");
		String beforeRepeat = fixture.snapshot();

		fixture.mockMvc.perform(post("/api/v1/submissions/{id}/submit", fixture.submissionId)
				.header("Authorization", fixture.bearer())).andExpect(status().isBadRequest());

		awaitExecutorIdle();
		assertThat(fixture.snapshot()).isEqualTo(beforeRepeat);
		verify(worker, times(1)).runAutoGrading(module);
		assertEvents(module);
	}

	// Before BE-66: PASS; submitModule already publishes the required event.
	@Test
	void doesNotRegradeAModuleAlreadyGradedBySubmitModule() throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		long questionId = fixture.choiceQuestion(moduleId, 1);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		fixture.mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", module)
				.header("Authorization", fixture.bearer()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"answers\":[{\"questionId\":" + questionId + ",\"content\":{\"selectedOptionIds\":[1]}}]}"))
				.andExpect(status().isOk());
		awaitCompleted(module, "1");
		String gradeBefore = fixture.gradingSnapshot(module);
		String answersBefore = fixture.objectMapper.writeValueAsString(fixture.answers());
		List<Long> gradingIds = fixture.gradingIds();

		fixture.finalSubmit();

		awaitExecutorIdle();
		assertThat(fixture.gradingSnapshot(module)).isEqualTo(gradeBefore);
		assertThat(fixture.grading(module).getGradedAt()).isNotNull();
		assertThat(fixture.objectMapper.writeValueAsString(fixture.answers())).isEqualTo(answersBefore);
		assertThat(fixture.gradingIds()).isEqualTo(gradingIds);
		assertThat(fixture.submissionModule(module).getStatus()).isEqualTo(SubmissionStatus.GRADED);
		verify(worker, times(1)).runAutoGrading(module);
		assertEvents(module);
	}

	// Before BE-66: FAIL on publication/worker assertions, even though the old grading is preserved.
	@ParameterizedTest
	@EnumSource(value = GradingStatus.class, names = {"COMPLETED", "FAILED", "AI_GRADED"})
	void publishesButSkipsAnExistingTerminalGrading(GradingStatus status) throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		Grading grading = fixture.grading(module);
		grading.setStatus(status);
		grading.setFinalScore(new BigDecimal("2.50"));
		grading.setFinalFeedback("Preserve this existing result");
		grading.setGradedAt(OffsetDateTime.now().minusHours(1));
		fixture.gradingRepository.save(grading);
		String before = fixture.gradingSnapshot(module);
		List<Long> gradingIds = fixture.gradingIds();

		fixture.finalSubmit();

		awaitWorkerCalls(module, 1);
		assertEvents(module);
		assertThat(fixture.gradingSnapshot(module)).isEqualTo(before);
		assertThat(fixture.gradingIds()).isEqualTo(gradingIds);
		assertThat(fixture.submissionModule(module).getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(fixture.answers()).isEmpty();
	}

	// Before BE-66: FAIL because the synchronous observer receives no publication.
	@Test
	void rolledBackFinalSubmitPublishesButNeverDispatchesAndLeavesTheFixtureUnchanged() throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		String before = fixture.snapshot();
		RuntimeException failure = new IllegalStateException("Force rollback after submit returned");
		List<String> timeline = new CopyOnWriteArrayList<>();
		List<Long> workerCalls = new CopyOnWriteArrayList<>();

		try (AutoCloseable observation = observeWorkerProxy(timeline, workerCalls)) {
			assertThatThrownBy(() -> fixture.asStudent(() -> transaction.executeWithoutResult(status -> {
				recordCommitTimeline(timeline, workerCalls);
				submissionService.submit(fixture.submissionId);
				timeline.add("submit-returned");
				assertThat(workerCalls).isEmpty();
				verify(worker, never()).runAutoGrading(module);
				throw failure;
			}))).isSameAs(failure);

			assertEvents(module);
			await().during(Duration.ofMillis(300)).atMost(TIMEOUT).untilAsserted(() -> {
				verify(worker, never()).runAutoGrading(module);
				assertThat(fixture.snapshot()).isEqualTo(before);
			});
			awaitExecutorIdle();
			verify(worker, never()).runAutoGrading(module);
			assertThat(workerCalls).isEmpty();
			assertThat(timeline).containsExactly("submit-returned");
			assertThat(fixture.snapshot()).isEqualTo(before);
		}
	}

	// Before BE-66: FAIL; this is the commit counterpart of the rollback test.
	@Test
	void committedFinalSubmitDispatchesExactlyOnceOnlyAfterTheOuterCommit() throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		List<String> timeline = new CopyOnWriteArrayList<>();
		List<Long> workerCalls = new CopyOnWriteArrayList<>();

		try (AutoCloseable observation = observeWorkerProxy(timeline, workerCalls)) {
			fixture.asStudent(() -> transaction.executeWithoutResult(status -> {
				recordCommitTimeline(timeline, workerCalls);
				submissionService.submit(fixture.submissionId);
				timeline.add("submit-returned");
				assertEvents(module);
				assertThat(workerCalls).isEmpty();
				verify(worker, never()).runAutoGrading(module);
			}));

			awaitCompleted(module, "0");
			assertEvents(module);
			verify(worker, times(1)).runAutoGrading(module);
			assertThat(workerCalls).containsExactly(module);
			assertThat(timeline).containsExactly("submit-returned", "beforeCommit", "afterCommit", "worker-call");
		}
	}

	// Before BE-66: PASS; duplicate delivery is isolated from final submit by using submitModule first.
	@Test
	void duplicateCommittedEventsDoNotRegradeOrDuplicateAnswers() throws Exception {
		long moduleId = fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		long questionId = fixture.choiceQuestion(moduleId, 1);
		fixture.start();
		long module = fixture.submissionModuleId(moduleId);
		fixture.mockMvc.perform(post("/api/v1/submission-modules/{id}/submit", module)
				.header("Authorization", fixture.bearer()).contentType(MediaType.APPLICATION_JSON)
				.content("{\"answers\":[{\"questionId\":" + questionId + ",\"content\":{\"selectedOptionIds\":[1]}}]}"))
				.andExpect(status().isOk());
		awaitCompleted(module, "1");
		String before = fixture.snapshot();

		transaction.executeWithoutResult(status -> {
			publisher.publishEvent(new SubmissionModuleSubmittedEvent(module));
			publisher.publishEvent(new SubmissionModuleSubmittedEvent(module));
		});

		awaitWorkerCalls(module, 3);
		assertEvents(module, module, module);
		assertThat(fixture.snapshot()).isEqualTo(before);
	}

	private AutoCloseable observeWorkerProxy(List<String> timeline, List<Long> workerCalls) {
		assertThat(workerProxy).isInstanceOf(Advised.class);
		Advised proxy = (Advised) workerProxy;
		assertThat(proxy.isFrozen()).isFalse();
		MethodInterceptor observer = invocation -> {
			if (invocation.getMethod().getName().equals("runAutoGrading")) {
				workerCalls.add((Long) invocation.getArguments()[0]);
				timeline.add("worker-call");
			}
			return invocation.proceed();
		};
		// Index zero observes the caller before the existing async interceptor schedules the task.
		proxy.addAdvice(0, observer);
		return () -> {
			proxy.removeAdvice(observer);
		};
	}

	private void recordCommitTimeline(List<String> timeline, List<Long> workerCalls) {
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public int getOrder() {
				return Ordered.HIGHEST_PRECEDENCE;
			}

			@Override
			public void beforeCommit(boolean readOnly) {
				timeline.add("beforeCommit");
				assertThat(workerCalls).isEmpty();
			}

			@Override
			public void afterCommit() {
				timeline.add("afterCommit");
			}
		});
	}

	private void awaitCompleted(long module, String score) {
		await().atMost(TIMEOUT).untilAsserted(() -> {
			Grading grading = fixture.grading(module);
			assertThat(grading.getStatus()).isEqualTo(GradingStatus.COMPLETED);
			assertThat(grading.getMethod()).isEqualTo(GradingMethod.AUTO);
			assertThat(grading.getFinalScore()).isEqualByComparingTo(score);
			assertThat(grading.getMaxScoreSnapshot()).isEqualByComparingTo("5");
			assertThat(grading.getGradedAt()).isNotNull();
			assertThat(fixture.submissionModule(module).getStatus()).isEqualTo(SubmissionStatus.GRADED);
		});
		awaitWorkerCalls(module, 1);
	}

	private void awaitWorkerCalls(long module, int calls) {
		await().atMost(TIMEOUT).untilAsserted(() -> verify(worker, times(calls)).runAutoGrading(module));
		awaitExecutorIdle();
	}

	private void awaitExecutorIdle() {
		await().atMost(TIMEOUT).untilAsserted(() -> {
			assertThat(executor.getActiveCount()).isZero();
			assertThat(executor.getThreadPoolExecutor().getQueue()).isEmpty();
		});
	}

	private void assertEvents(Long... moduleIds) {
		assertThat(events.forModules(fixture.submissionModuleIds())).containsExactlyInAnyOrder(moduleIds);
	}

	private void assertManualUnchanged(long module, String before) {
		assertThat(fixture.submissionModule(module).getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		Grading grading = fixture.grading(module);
		assertThat(grading.getMethod()).isEqualTo(GradingMethod.TEACHER_MANUAL);
		assertThat(grading.getStatus()).isEqualTo(GradingStatus.PENDING);
		assertThat(grading.getFinalScore()).isNull();
		assertThat(fixture.gradingSnapshot(module)).isEqualTo(before);
		verify(worker, never()).runAutoGrading(module);
		assertThat(events.forModules(List.of(module))).isEmpty();
	}

	static class PublishedEvents {
		private final List<Long> moduleIds = new CopyOnWriteArrayList<>();

		@EventListener
		public void onPublished(SubmissionModuleSubmittedEvent event) {
			moduleIds.add(event.submissionModuleId());
		}

		void clear() {
			moduleIds.clear();
		}

		List<Long> forModules(Collection<Long> fixtureModuleIds) {
			return moduleIds.stream().filter(fixtureModuleIds::contains).toList();
		}
	}

	/** Shared only by the two BE-66 test classes; all reads are scoped to the current fixture. */
	static class Fixture {
		final MockMvc mockMvc;
		final ObjectMapper objectMapper;
		final GradingRepository gradingRepository;
		private final JwtTokenService jwtTokenService;
		private final UserRepository userRepository;
		private final TeacherProfileRepository teacherProfileRepository;
		private final StudentProfileRepository studentProfileRepository;
		private final ClassJpaRepository classRepository;
		private final ClassMemberRepository classMemberRepository;
		private final AssignmentRepository assignmentRepository;
		private final AssignmentModuleRepository assignmentModuleRepository;
		private final QuestionRepository questionRepository;
		private final SubmissionRepository submissionRepository;
		private final SpringDataSubmissionModuleRepository submissionModuleRepository;
		private final AnswerRepository answerRepository;
		private long studentId;
		private long assignmentId;
		long submissionId;
		private int moduleOrder;

		Fixture(MockMvc mockMvc, ObjectMapper objectMapper, JwtTokenService jwtTokenService,
				UserRepository userRepository, TeacherProfileRepository teacherProfileRepository,
				StudentProfileRepository studentProfileRepository, ClassJpaRepository classRepository,
				ClassMemberRepository classMemberRepository, AssignmentRepository assignmentRepository,
				AssignmentModuleRepository assignmentModuleRepository, QuestionRepository questionRepository,
				SubmissionRepository submissionRepository, SpringDataSubmissionModuleRepository submissionModuleRepository,
				AnswerRepository answerRepository, GradingRepository gradingRepository) {
			this.mockMvc = mockMvc;
			this.objectMapper = objectMapper;
			this.jwtTokenService = jwtTokenService;
			this.userRepository = userRepository;
			this.teacherProfileRepository = teacherProfileRepository;
			this.studentProfileRepository = studentProfileRepository;
			this.classRepository = classRepository;
			this.classMemberRepository = classMemberRepository;
			this.assignmentRepository = assignmentRepository;
			this.assignmentModuleRepository = assignmentModuleRepository;
			this.questionRepository = questionRepository;
			this.submissionRepository = submissionRepository;
			this.submissionModuleRepository = submissionModuleRepository;
			this.answerRepository = answerRepository;
			this.gradingRepository = gradingRepository;
		}

		void create() {
			SecurityContextHolder.clearContext();
			moduleOrder = 0;
			submissionId = 0;
			String suffix = UUID.randomUUID().toString();
			User teacher = userRepository.save(new User("BE-66 Teacher", "teacher-" + suffix + "@englishhub.test",
					null, "test-hash", UserRole.TEACHER, UserStatus.ACTIVE, false));
			teacherProfileRepository.save(new TeacherProfile(teacher, "English"));
			User student = userRepository.save(new User("BE-66 Student", "student-" + suffix + "@englishhub.test",
					null, "test-hash", UserRole.STUDENT, UserStatus.ACTIVE, false));
			studentId = student.getId();
			studentProfileRepository.save(new StudentProfile(student, "BE66-" + suffix.substring(0, 10),
					LocalDate.of(2004, 3, 4), null));
			long classId = classRepository.save(new ClassEntity("BE-66 " + suffix, "Intermediate", "Final submit fixture",
					LocalDate.of(2026, 9, 1), null, ClassStatus.ACTIVE, teacher.getId())).getId();
			classMemberRepository.save(new ClassMember(classId, studentId));
			assignmentId = assignmentRepository.save(new Assignment(classId, "BE-66 " + suffix, "Final submit fixture",
					OffsetDateTime.now().minusHours(1), OffsetDateTime.now().plusHours(48), 2, false,
					AssignmentStatus.PUBLISHED)).getId();
		}

		long module(ModuleSkill skill, ModuleTaskType taskType) {
			moduleOrder++;
			return assignmentModuleRepository.save(new AssignmentModule(assignmentId, skill, taskType, moduleOrder,
					"BE-66 task", new BigDecimal("5.00"), null, null, null, null, null)).getId();
		}

		long choiceQuestion(long moduleId, int order) {
			return questionRepository.save(new Question(moduleId, "Choose an option", QuestionType.MULTIPLE_CHOICE,
					"{\"options\":[{\"id\":1,\"content\":\"Correct\",\"isCorrect\":true},"
							+ "{\"id\":2,\"content\":\"Wrong\",\"isCorrect\":false}]}",
					BigDecimal.ONE, order)).getId();
		}

		long rewriteQuestion(long moduleId) {
			return questionRepository.save(new Question(moduleId, "Complete the sentence", QuestionType.SHORT_ANSWER,
					"{\"correctAnswer\":\"English\"}", new BigDecimal("5.00"), 1)).getId();
		}

		void start() throws Exception {
			String response = mockMvc.perform(post("/api/v1/assignments/{id}/submissions", assignmentId)
					.header("Authorization", bearer())).andExpect(status().isCreated())
					.andReturn().getResponse().getContentAsString();
			submissionId = objectMapper.readTree(response).get("id").asLong();
		}

		void finalSubmit() throws Exception {
			mockMvc.perform(post("/api/v1/submissions/{id}/submit", submissionId).header("Authorization", bearer()))
					.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("SUBMITTED"))
					.andExpect(jsonPath("$.message").value("Nộp bài thành công."))
					.andExpect(jsonPath("$.submittedAt").exists());
			assertThat(submissionRepository.findById(submissionId).orElseThrow().getStatus())
					.isEqualTo(SubmissionStatus.SUBMITTED);
		}

		String bearer() {
			return "Bearer " + jwtTokenService.createAccessToken(studentId,
					com.english_hub.core.modules.user.domain.model.UserRole.STUDENT);
		}

		void asStudent(Runnable action) {
			var principal = new JwtPrincipal(studentId, com.english_hub.core.modules.user.domain.model.UserRole.STUDENT);
			SecurityContextHolder.getContext().setAuthentication(
					new UsernamePasswordAuthenticationToken(principal, "integration-test", List.of()));
			try {
				action.run();
			} finally {
				SecurityContextHolder.clearContext();
			}
		}

		long submissionModuleId(long moduleId) {
			for (SubmissionModule module : modules()) {
				if (module.getModuleId().equals(moduleId)) {
					return module.getId();
				}
				}
			throw new IllegalArgumentException("Module is not part of this fixture: " + moduleId);
		}

		List<Long> submissionModuleIds() {
			return modules().stream().map(SubmissionModule::getId).toList();
		}

		SubmissionModule submissionModule(long moduleId) {
			return submissionModuleRepository.findById(moduleId).orElseThrow();
		}

		Grading grading(long moduleId) {
			return gradingRepository.findBySubmissionModuleId(moduleId).orElseThrow();
		}

		List<Long> gradingIds() {
			return gradings().stream().map(Grading::getId).toList();
		}

		String gradingSnapshot(long moduleId) {
			return objectMapper.writeValueAsString(grading(moduleId));
		}

		void answer(long moduleId, long questionId, String content) {
			answerRepository.save(new Answer(moduleId, questionId, content, null, null, null, null, null, null, null, null, null));
		}

		List<Answer> answers() {
			List<Answer> answers = new ArrayList<>();
			for (Long moduleId : submissionModuleIds()) {
				answers.addAll(answerRepository.findBySubmissionModuleId(moduleId));
			}
			answers.sort(Comparator.comparing(Answer::getId));
			return answers;
		}

		String snapshot() {
			Submission parent = submissionRepository.findById(submissionId).orElseThrow();
			return objectMapper.writeValueAsString(List.of(parent, modules(), gradings(), answers()));
		}

		private List<SubmissionModule> modules() {
			List<SubmissionModule> modules = new ArrayList<>(submissionModuleRepository.findBySubmissionId(submissionId));
			modules.sort(Comparator.comparing(SubmissionModule::getId));
			return modules;
		}

		private List<Grading> gradings() {
			List<Long> moduleIds = submissionModuleIds();
			List<Grading> gradings = new ArrayList<>(gradingRepository.findAll(
					(root, query, builder) -> root.get("submissionModuleId").in(moduleIds)));
			gradings.sort(Comparator.comparing(Grading::getId));
			return gradings;
		}
	}
}
