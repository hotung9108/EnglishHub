package com.english_hub.core.modules.module.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Verifies ordered writes with real request transactions and database locks. */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class OrderedWriteConcurrencyIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_ordered_write_test")
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
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private ClassJpaRepository classRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private AssignmentModuleRepository moduleRepository;

	@Autowired
	private JwtTokenService jwtTokenService;

	@Autowired
	private PlatformTransactionManager transactionManager;

	private Long teacherId;
	private Long assignmentId;
	private Long moduleId;
	private TransactionTemplate transactionTemplate;

	@BeforeEach
	void setUp() {
		transactionTemplate = new TransactionTemplate(transactionManager);
		teacherId = createUser();
		teacherProfileRepository.save(new TeacherProfile(findUser(teacherId), "IELTS"));

		ClassEntity englishClass = classRepository.save(new ClassEntity(
				"Order concurrency class " + uniqueSuffix(),
				"Intermediate",
				"Order concurrency test class",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId));
		Assignment assignment = assignmentRepository.save(new Assignment(
				englishClass.getId(),
				"Order concurrency assignment",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));
		assignmentId = assignment.getId();

		AssignmentModule module = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Read",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				"Grade reading"));
		moduleId = module.getId();
	}

	@Test
	void concurrentModuleCreatesWithSameOrderIndexReturnOneSuccessAndOneDuplicate() throws Exception {
		List<ResponseSnapshot> responses = runConcurrently(() -> performModuleCreate());

		assertOneSuccessAndOneDuplicate(
				responses,
				"orderIndex đã được sử dụng trong bài tập này.");
	}

	@Test
	void concurrentQuestionCreatesWithSameOrderIndexReturnOneSuccessAndOneDuplicate() throws Exception {
		List<ResponseSnapshot> responses = runConcurrently(() -> performQuestionCreate());

		assertOneSuccessAndOneDuplicate(
				responses,
				"orderIndex đã được sử dụng trong module này.");
	}

	@Test
	void moduleLockTimeoutReturnsConflictInsteadOfServerError() throws Exception {
		CountDownLatch lockAcquired = new CountDownLatch(1);
		CountDownLatch releaseLock = new CountDownLatch(1);
		ExecutorService holderExecutor = Executors.newSingleThreadExecutor();
		Future<?> holder = holderExecutor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
			assignmentRepository.findByIdForUpdate(assignmentId).orElseThrow();
			lockAcquired.countDown();
			awaitRelease(releaseLock, status);
		}));

		ExecutorService contenderExecutor = Executors.newSingleThreadExecutor();
		try {
			assertThat(lockAcquired.await(10, TimeUnit.SECONDS)).isTrue();
			Future<ResponseSnapshot> contender = contenderExecutor.submit(this::performModuleCreate);
			ResponseSnapshot response = contender.get(15, TimeUnit.SECONDS);

			assertThat(response.status()).isEqualTo(409);
			assertThat(response.body()).contains("Tài nguyên đang được cập nhật, vui lòng thử lại.");
		} finally {
			releaseLock.countDown();
			awaitFuture(holder);
			contenderExecutor.shutdownNow();
			holderExecutor.shutdownNow();
		}
	}

	@Test
	void questionLockTimeoutReturnsConflictInsteadOfServerError() throws Exception {
		CountDownLatch lockAcquired = new CountDownLatch(1);
		CountDownLatch releaseLock = new CountDownLatch(1);
		ExecutorService holderExecutor = Executors.newSingleThreadExecutor();
		Future<?> holder = holderExecutor.submit(() -> transactionTemplate.executeWithoutResult(status -> {
			moduleRepository.findByIdForUpdate(moduleId).orElseThrow();
			lockAcquired.countDown();
			awaitRelease(releaseLock, status);
		}));

		ExecutorService contenderExecutor = Executors.newSingleThreadExecutor();
		try {
			assertThat(lockAcquired.await(10, TimeUnit.SECONDS)).isTrue();
			Future<ResponseSnapshot> contender = contenderExecutor.submit(this::performQuestionCreate);
			ResponseSnapshot response = contender.get(15, TimeUnit.SECONDS);

			assertThat(response.status()).isEqualTo(409);
			assertThat(response.body()).contains("Tài nguyên đang được cập nhật, vui lòng thử lại.");
		} finally {
			releaseLock.countDown();
			awaitFuture(holder);
			contenderExecutor.shutdownNow();
			holderExecutor.shutdownNow();
		}
	}

	private List<ResponseSnapshot> runConcurrently(Request request) throws Exception {
		ExecutorService executor = Executors.newFixedThreadPool(2);
		CountDownLatch start = new CountDownLatch(1);
		Future<ResponseSnapshot> first = executor.submit(() -> awaitStartAndRun(start, request));
		Future<ResponseSnapshot> second = executor.submit(() -> awaitStartAndRun(start, request));
		try {
			start.countDown();
			return List.of(
					first.get(15, TimeUnit.SECONDS),
					second.get(15, TimeUnit.SECONDS));
		} finally {
			executor.shutdownNow();
		}
	}

	private ResponseSnapshot awaitStartAndRun(CountDownLatch start, Request request) throws Exception {
		if (!start.await(10, TimeUnit.SECONDS)) {
			throw new IllegalStateException("Concurrent request start timed out");
		}
		return request.perform();
	}

	private ResponseSnapshot performModuleCreate() throws Exception {
		return snapshot(mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":2}"))
				.andReturn());
	}

	private ResponseSnapshot performQuestionCreate() throws Exception {
		return snapshot(mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer())
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"content\":\"Concurrent question\",\"questionType\":\"SHORT_ANSWER\","
						+ "\"correctAnswer\":{\"correctAnswer\":\"English\"},\"orderIndex\":1}"))
				.andReturn());
	}

	private ResponseSnapshot snapshot(MvcResult result) throws Exception {
		return new ResponseSnapshot(
				result.getResponse().getStatus(),
				result.getResponse().getContentAsString());
	}

	private void assertOneSuccessAndOneDuplicate(List<ResponseSnapshot> responses, String errorMessage) {
		assertThat(responses).extracting(ResponseSnapshot::status)
				.containsExactlyInAnyOrder(201, 400);
		ResponseSnapshot duplicate = responses.stream()
				.filter(response -> response.status() == 400)
				.findFirst()
				.orElseThrow();
		assertThat(duplicate.body()).contains(errorMessage);
	}

	private void awaitRelease(CountDownLatch releaseLock, org.springframework.transaction.TransactionStatus status) {
		try {
			if (!releaseLock.await(15, TimeUnit.SECONDS)) {
				status.setRollbackOnly();
			}
		} catch (InterruptedException exception) {
			status.setRollbackOnly();
			Thread.currentThread().interrupt();
		}
	}

	private void awaitFuture(Future<?> future) throws Exception {
		future.get(10, TimeUnit.SECONDS);
	}

	private Long createUser() {
		User user = new User(
				"Order teacher " + uniqueSuffix(),
				"order-teacher-" + uniqueSuffix() + "@englishhub.test",
				"0912345678",
				"hash",
				UserRole.TEACHER,
				UserStatus.ACTIVE,
				false);
		return userRepository.save(user).getId();
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId).orElseThrow();
	}

	private String bearer() {
		return "Bearer " + jwtTokenService.createAccessToken(
				teacherId,
				com.english_hub.core.modules.user.domain.model.UserRole.TEACHER);
	}

	private String uniqueSuffix() {
		return UUID.randomUUID().toString().substring(0, 8);
	}

	@FunctionalInterface
	private interface Request {
		ResponseSnapshot perform() throws Exception;
	}

	private record ResponseSnapshot(int status, String body) {
	}
}
