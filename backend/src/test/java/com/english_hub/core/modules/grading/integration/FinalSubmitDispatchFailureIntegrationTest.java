package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.modules.grading.application.event.AutoGradingAsyncWorker;
import com.english_hub.core.modules.grading.application.service.AutoGradingFailureRecorder;
import com.english_hub.core.modules.grading.integration.FinalSubmitAutoGradingIntegrationTest.Fixture;
import com.english_hub.core.modules.grading.integration.FinalSubmitAutoGradingIntegrationTest.PublishedEvents;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.util.AopTestUtils;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Only the executor is replaced; commit, listener, worker, grader, and failure recorder remain real. */
@Testcontainers
@SpringBootTest(properties = {"spring.flyway.enabled=true", "spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
@MockitoBean(name = "autoGradingExecutor", types = Executor.class, enforceOverride = true)
@MockitoSpyBean(types = {AutoGradingAsyncWorker.class, AutoGradingFailureRecorder.class})
@Import({Fixture.class, PublishedEvents.class})
class FinalSubmitDispatchFailureIntegrationTest {

	private static final Duration TIMEOUT = Duration.ofSeconds(10);

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_final_dispatch_failure_test").withUsername("test").withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private final Fixture fixture;
	private final PublishedEvents events;
	private final Executor executor;
	private final AutoGradingAsyncWorker worker;
	private final AutoGradingFailureRecorder recorder;
	private final AtomicInteger attemptedTasks = new AtomicInteger();
	private final AtomicInteger acceptedTasks = new AtomicInteger();
	private final AtomicInteger finishedTasks = new AtomicInteger();
	private int rejectedIndex;
	private boolean rejectAll;

	FinalSubmitDispatchFailureIntegrationTest(
			Fixture fixture, PublishedEvents events, @Qualifier("autoGradingExecutor") Executor executor,
			AutoGradingAsyncWorker worker, AutoGradingFailureRecorder recorder) {
		this.fixture = fixture;
		this.events = events;
		this.executor = executor;
		this.worker = AopTestUtils.getUltimateTargetObject(worker);
		this.recorder = AopTestUtils.getUltimateTargetObject(recorder);
	}

	@BeforeEach
	void setUp() {
		awaitAcceptedTasksFinished();
		reset(executor, worker, recorder);
		events.clear();
		attemptedTasks.set(0);
		acceptedTasks.set(0);
		finishedTasks.set(0);
		rejectedIndex = 0;
		rejectAll = false;
		fixture.create();
		doAnswer(invocation -> {
			int index = attemptedTasks.getAndIncrement();
			if (rejectAll || index == rejectedIndex) {
				throw new RejectedExecutionException("BE-66 executor rejection at index " + index);
			}
			Runnable task = invocation.getArgument(0);
			acceptedTasks.incrementAndGet();
			CompletableFuture.runAsync(() -> {
				try {
					task.run();
				} finally {
					finishedTasks.incrementAndGet();
				}
			});
			return null;
		}).when(executor).execute(any(Runnable.class));
	}

	// Before BE-66: FAIL; no final-submit events reach the executor or recorder.
	@ParameterizedTest(name = "executor rejection at index {0} preserves commit and other dispatches")
	@ValueSource(ints = {0, 1})
	void rejectedDispatchDoesNotFailTheCommittedRequestOrPreventAnotherModuleFromGrading(int index) throws Exception {
		rejectedIndex = index;
		createTwoAutoModulesAndStart();
		List<Long> moduleIds = fixture.submissionModuleIds();
		List<Long> gradingIds = fixture.gradingIds();

		fixture.finalSubmit();

		await().atMost(TIMEOUT).untilAsserted(() -> {
			List<GradingStatus> statuses = moduleIds.stream().map(id -> fixture.grading(id).getStatus()).toList();
			assertThat(statuses).containsExactlyInAnyOrder(GradingStatus.FAILED, GradingStatus.COMPLETED);
		});
		awaitAcceptedTasksFinished();
		assertThat(attemptedTasks.get()).isEqualTo(2);
		assertThat(acceptedTasks.get()).isEqualTo(1);
		assertThat(events.forModules(moduleIds)).containsExactlyInAnyOrderElementsOf(moduleIds);
		assertThat(fixture.gradingIds()).isEqualTo(gradingIds);
		for (Long moduleId : moduleIds) {
			if (fixture.grading(moduleId).getStatus() == GradingStatus.FAILED) {
				assertRejectedModule(moduleId);
			} else {
				assertThat(fixture.submissionModule(moduleId).getStatus()).isEqualTo(SubmissionStatus.GRADED);
				assertThat(fixture.grading(moduleId).getFinalScore()).isEqualByComparingTo("0");
				verify(worker, times(1)).runAutoGrading(moduleId);
				verify(recorder, never()).recordFailed(eq(moduleId), any(Throwable.class));
			}
		}
	}

	// Before BE-66: FAIL; both grading rows remain PENDING instead of recording rejection.
	@Test
	void recordsEveryRejectedDispatchWithoutFailingTheCommittedRequest() throws Exception {
		rejectAll = true;
		createTwoAutoModulesAndStart();
		List<Long> moduleIds = fixture.submissionModuleIds();
		List<Long> gradingIds = fixture.gradingIds();

		fixture.finalSubmit();

		await().atMost(TIMEOUT).untilAsserted(() -> {
			for (Long moduleId : moduleIds) {
				assertThat(fixture.grading(moduleId).getStatus()).isEqualTo(GradingStatus.FAILED);
			}
		});
		awaitAcceptedTasksFinished();
		assertThat(attemptedTasks.get()).isEqualTo(2);
		assertThat(acceptedTasks.get()).isZero();
		assertThat(events.forModules(moduleIds)).containsExactlyInAnyOrderElementsOf(moduleIds);
		assertThat(fixture.gradingIds()).isEqualTo(gradingIds);
		for (Long moduleId : moduleIds) {
			assertRejectedModule(moduleId);
		}
	}

	private void createTwoAutoModulesAndStart() throws Exception {
		fixture.module(ModuleSkill.READING, ModuleTaskType.QUIZ);
		fixture.module(ModuleSkill.LISTENING, ModuleTaskType.QUIZ);
		fixture.start();
	}

	private void assertRejectedModule(long moduleId) {
		assertThat(fixture.submissionModule(moduleId).getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(fixture.grading(moduleId).getFinalScore()).isNull();
		verify(recorder, times(1)).recordFailed(eq(moduleId), any(RejectedExecutionException.class));
		verify(worker, never()).runAutoGrading(moduleId);
	}

	private void awaitAcceptedTasksFinished() {
		await().atMost(TIMEOUT).untilAsserted(() -> assertThat(finishedTasks.get()).isEqualTo(acceptedTasks.get()));
	}
}
