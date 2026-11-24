package com.english_hub.core.modules.assignment.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.assignment.application.service.AssignmentService;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.LockTimeoutException;
import jakarta.persistence.PessimisticLockException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;
import org.aopalliance.intercept.MethodInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.aop.framework.Advised;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest
@AutoConfigureMockMvc
@Import(AssignmentApiIntegrationTest.FixedClockConfiguration.class)
@EnabledIfEnvironmentVariable(named = "SPRING_DATASOURCE_URL", matches = "jdbc:postgresql://[^/]+/[\\w-]+_test(?:\\?.*)?")
@Transactional
class AssignmentApiIntegrationTest {

	private static final OffsetDateTime TEST_NOW = OffsetDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
	private static final OffsetDateTime OPEN_AT = TEST_NOW.minusDays(2);
	private static final OffsetDateTime FUTURE_CLOSE_AT = TEST_NOW.plusDays(2);

	private final MockMvc mockMvc;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final ClassJpaRepository classRepository;
	private final ClassMemberJpaRepository classMemberRepository;
	private final AssignmentRepository assignmentRepository;
	private final SubmissionRepository submissionRepository;
	private final JwtTokenService jwtTokenService;
	private final EntityManager entityManager;
	private final TransactionTemplate raceTransaction;

	private Long adminId;
	private Long teacherId;
	private Long otherTeacherId;
	private Long studentId;
	private Long otherStudentId;
	private Long classId;
	private Long assignmentId;

	@Autowired
	AssignmentApiIntegrationTest(MockMvc mockMvc, UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository, StudentProfileRepository studentProfileRepository,
			ClassJpaRepository classRepository, ClassMemberJpaRepository classMemberRepository,
			AssignmentRepository assignmentRepository, SubmissionRepository submissionRepository,
			JwtTokenService jwtTokenService, EntityManager entityManager, PlatformTransactionManager transactionManager) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.assignmentRepository = assignmentRepository;
		this.submissionRepository = submissionRepository;
		this.jwtTokenService = jwtTokenService;
		this.entityManager = entityManager;
		this.raceTransaction = new TransactionTemplate(transactionManager);
	}

	@BeforeEach
	void setUp() {
		adminId = createUser(UserRole.ADMIN, "Admin");
		teacherId = createUser(UserRole.TEACHER, "Teacher");
		otherTeacherId = createUser(UserRole.TEACHER, "Other teacher");
		studentId = createUser(UserRole.STUDENT, "Student");
		otherStudentId = createUser(UserRole.STUDENT, "Other student");

		teacherProfileRepository.save(new TeacherProfile(findUser(teacherId), "IELTS"));
		teacherProfileRepository.save(new TeacherProfile(findUser(otherTeacherId), "IELTS"));
		studentProfileRepository.save(new StudentProfile(
				findUser(studentId),
				"HV-" + uniqueSuffix(),
				LocalDate.of(2004, 4, 1),
				"0912345678"));
		studentProfileRepository.save(new StudentProfile(
				findUser(otherStudentId),
				"HV-" + uniqueSuffix(),
				LocalDate.of(2005, 5, 2),
				"0912345679"));

		ClassEntity englishClass = classRepository.save(new ClassEntity(
				"Assignment class " + uniqueSuffix(),
				"Intermediate",
				"Assignment API test class",
				LocalDate.of(2026, 9, 15),
				null,
				com.english_hub.core.modules.classroom.domain.model.ClassStatus.ACTIVE,
				teacherId));
		classId = englishClass.getId();
		classMemberRepository.save(new ClassMemberEntity(classId, studentId));

		Assignment assignment = assignmentRepository.save(new Assignment(
				classId,
				"Weekly Test 1",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));
		assignmentId = assignment.getId();
	}

	@Test
	void listIsVisibleToAdminOwnerAndMemberButNotNonOwnersOrNonMembers() throws Exception {
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(assignmentId));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)))
				.andExpect(jsonPath("$.pagination.total").value(0));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(assignmentId))
				.andExpect(jsonPath("$.data[0].status").value("DRAFT"));
	}

	@Test
	void listReturnsTotalForEveryMatchingPageInASingleQuery() throws Exception {
		assignmentRepository.save(new Assignment(
				classId,
				"Weekly Test 2",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.PUBLISHED));
		assignmentRepository.save(new Assignment(
				classId,
				"Weekly Test 3",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));

		// Page 1 of 2 rows: the total must still reflect all 3 matching rows.
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.param("page", "1")
					.param("limit", "2")
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.pagination.total").value(3));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.param("page", "2")
					.param("limit", "2")
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.pagination.total").value(3));

		// The status filter must be applied before the window count.
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.param("status", "PUBLISHED")
					.param("limit", "2")
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.pagination.total").value(1));
	}

	@Test
	void listReturnsZeroTotalForAnEmptyPage() throws Exception {
		ClassEntity emptyClass = classRepository.save(new ClassEntity(
				"Empty assignment class " + uniqueSuffix(),
				"Intermediate",
				"Empty page fixture",
				LocalDate.of(2026, 9, 15),
				null,
				com.english_hub.core.modules.classroom.domain.model.ClassStatus.ACTIVE,
				teacherId));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", emptyClass.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)))
				.andExpect(jsonPath("$.pagination.total").value(0));
	}

	@Test
	void listReturnsNotFoundForAnUnknownClass() throws Exception {
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", 999_999_999L)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy lớp học."));
	}

	@Test
	void teacherAndStudentFromOneClassCannotReadAssignmentsFromAnotherClass() throws Exception {
		ClassEntity foreignClass = classRepository.save(new ClassEntity(
				"Foreign assignment class " + uniqueSuffix(),
				"Advanced",
				"Assignment resource-scope fixture",
				LocalDate.of(2026, 9, 15),
				null,
				com.english_hub.core.modules.classroom.domain.model.ClassStatus.ACTIVE,
				otherTeacherId));
		Assignment foreignAssignment = assignmentRepository.save(new Assignment(
				foreignClass.getId(),
				"Foreign assignment " + uniqueSuffix(),
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", foreignClass.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", foreignClass.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/assignments/{id}", foreignAssignment.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/assignments/{id}", foreignAssignment.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(status().isForbidden());
	}

	@Test
	void createRequiresTeacherOwnershipAndAssignedTeacher() throws Exception {
		mockMvc.perform(post("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validCreateBody()))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Tạo bài tập thành công."))
				.andExpect(jsonPath("$.id").isNumber());

		mockMvc.perform(post("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validCreateBody()))
				.andExpect(status().isForbidden());
		mockMvc.perform(post("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validCreateBody()))
				.andExpect(status().isForbidden());
		mockMvc.perform(post("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validCreateBody().replace("\"maxSubmissions\":2", "\"maxSubmissions\":0")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"Dữ liệu thời gian hoặc số lần nộp không hợp lệ."));

		ClassEntity unassignedClass = classRepository.save(new ClassEntity(
				"Unassigned " + uniqueSuffix(),
				"Intermediate",
				null,
				LocalDate.of(2026, 9, 15),
				null,
				com.english_hub.core.modules.classroom.domain.model.ClassStatus.ACTIVE,
				null));
		mockMvc.perform(post("/api/v1/classes/{id}/assignments", unassignedClass.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(validCreateBody()))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"Lớp học chưa được gán giáo viên phụ trách, không thể tạo bài tập."));
	}

	@Test
	void detailAndUpdateFollowOwnershipAndClosedRules() throws Exception {
		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(assignmentId))
				.andExpect(jsonPath("$.modules").isArray());
		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"title\":\"Updated title\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật bài tập thành công."));

		mockMvc.perform(put("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"title\":\"Should fail\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(patch("/api/v1/assignments/{id}/status", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"status\":\"PUBLISHED\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã công bố bài tập."));
		mockMvc.perform(patch("/api/v1/assignments/{id}/status", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"status\":\"CLOSED\"}"))
				.andExpect(status().isOk());
		mockMvc.perform(put("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"title\":\"Should fail\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể sửa bài tập đã đóng."));
	}

	@ParameterizedTest
	@CsvSource({
			"DRAFT, DRAFT, 400", "DRAFT, PUBLISHED, 200", "DRAFT, CLOSED, 400",
			"PUBLISHED, DRAFT, 400", "PUBLISHED, PUBLISHED, 400", "PUBLISHED, CLOSED, 200",
			"CLOSED, DRAFT, 400", "CLOSED, PUBLISHED, 200", "CLOSED, CLOSED, 400"
	})
	void allowsOnlyValidStatusTransitions(AssignmentStatus current, AssignmentStatus target, int expectedStatus)
			throws Exception {
		Assignment before = saveBe84Assignment(current, FUTURE_CLOSE_AT, 2, false);
		mockMvc.perform(patchStatus(before.getId(), statusBody(target, null))
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().is(expectedStatus));

		Assignment stored = reloadAssignment(before.getId());
		if (expectedStatus == 200) {
			assertThat(stored.getStatus()).isEqualTo(target);
			assertThat(stored.getCloseAt()).isEqualTo(before.getCloseAt());
		} else {
			assertThat(stored).usingRecursiveComparison().isEqualTo(before);
		}
	}

	@ParameterizedTest
	@ValueSource(booleans = {false, true})
	void reopensAssignmentAndAllowsEditAndNextAttempt(boolean extendDeadline) throws Exception {
		OffsetDateTime storedCloseAt = extendDeadline ? TEST_NOW.minusDays(1) : FUTURE_CLOSE_AT;
		OffsetDateTime requestedCloseAt = extendDeadline ? FUTURE_CLOSE_AT : null;
		Assignment before = saveBe84Assignment(AssignmentStatus.CLOSED, storedCloseAt, 2, false);
		Long id = before.getId();
		OffsetDateTime submittedAt = TEST_NOW.minusDays(2).plusHours(1);
		Long previousAttemptId = submissionRepository.saveAndFlush(
				new Submission(id, studentId, 1, submittedAt, SubmissionStatus.SUBMITTED)).getId();

		mockMvc.perform(patchStatus(id, statusBody(AssignmentStatus.PUBLISHED, requestedCloseAt))
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk());
		Assignment reopened = reloadAssignment(id);
		assertThat(reopened.getCloseAt().toInstant()).isEqualTo(FUTURE_CLOSE_AT.toInstant());
		assertThat(reopened.getOpenAt()).isEqualTo(before.getOpenAt());
		mockMvc.perform(get("/api/v1/assignments/{id}", id)
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("PUBLISHED"));

		mockMvc.perform(putAssignment(id, "{\"title\":\"Updated after reopening\"}")
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk());
		assertThat(reloadAssignment(id).getTitle()).isEqualTo("Updated after reopening");

		mockMvc.perform(post("/api/v1/assignments/{id}/submissions", id)
					.header(HttpHeaders.AUTHORIZATION, bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.attemptNumber").value(2));
		entityManager.flush();
		entityManager.clear();
		Submission previousAttempt = submissionRepository.findById(previousAttemptId).orElseThrow();
		assertThat(previousAttempt.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
		assertThat(previousAttempt.getSubmittedAt().toInstant()).isEqualTo(submittedAt.toInstant());
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("invalidReopenDeadlines")
	void rejectsInvalidReopenDeadlineAndPreservesAssignment(String scenario, OffsetDateTime storedCloseAt,
			OffsetDateTime requestedCloseAt, String expectedError) throws Exception {
		Assignment before = saveBe84Assignment(AssignmentStatus.CLOSED, storedCloseAt, 2, false);

		mockMvc.perform(patchStatus(before.getId(), statusBody(AssignmentStatus.PUBLISHED, requestedCloseAt))
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(expectedError));

		assertThat(reloadAssignment(before.getId())).usingRecursiveComparison().isEqualTo(before);
	}

	private static Stream<Arguments> invalidReopenDeadlines() {
		String notFuture = "Hạn nộp khi mở lại phải sau thời điểm hiện tại.";
		return Stream.of(
				Arguments.of("before openAt", FUTURE_CLOSE_AT, OPEN_AT.minusDays(1),
						"Hạn nộp phải sau thời điểm mở bài."),
				Arguments.of("equal to now", FUTURE_CLOSE_AT, TEST_NOW, notFuture),
				Arguments.of("expired stored deadline", TEST_NOW.minusDays(1), null, notFuture));
	}

	@ParameterizedTest
	@CsvSource(value = {
			"2, 1, 1", "3, 1, 1", "null, 1, 1",
			"3, 2, 2", "2, 2, 2", "2, null, 2", "null, 2, 2"
	}, nullValues = "null")
	void appliesMaxSubmissionsPolicy(Integer currentCap, Integer requestedCap, Integer expectedCap) throws Exception {
		Assignment before = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, currentCap, false);
		classMemberRepository.save(new ClassMemberEntity(classId, otherStudentId));
		OffsetDateTime submittedAt = TEST_NOW.minusHours(1);
		submissionRepository.saveAll(List.of(
				new Submission(before.getId(), studentId, 1, submittedAt, SubmissionStatus.SUBMITTED),
				new Submission(before.getId(), studentId, 2, null, SubmissionStatus.IN_PROGRESS),
				new Submission(before.getId(), otherStudentId, 1, submittedAt, SubmissionStatus.SUBMITTED)));

		String body = "{\"maxSubmissions\":" + requestedCap + ",\"title\":\"Updated cap policy\"}";
		mockMvc.perform(putAssignment(before.getId(), body)
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.maxSubmissions").value(expectedCap));

		Assignment stored = reloadAssignment(before.getId());
		assertThat(stored.getMaxSubmissions()).isEqualTo(expectedCap);
		assertThat(stored.getTitle()).isEqualTo("Updated cap policy");
	}

	@Test
	void canDecreaseCapWhenOnlyOtherAssignmentsHaveAttempts() throws Exception {
		Assignment otherAssignment = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, 3, false);
		submissionRepository.saveAll(List.of(
				new Submission(otherAssignment.getId(), studentId, 1, TEST_NOW.minusHours(1), SubmissionStatus.SUBMITTED),
				new Submission(otherAssignment.getId(), studentId, 2, null, SubmissionStatus.IN_PROGRESS)));
		Assignment target = saveBe84Assignment(AssignmentStatus.DRAFT, FUTURE_CLOSE_AT, 3, false);

		mockMvc.perform(putAssignment(target.getId(), "{\"maxSubmissions\":1}")
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.maxSubmissions").value(1));
		assertThat(reloadAssignment(target.getId()).getMaxSubmissions()).isEqualTo(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, -1})
	void rejectsNonPositiveCapWithoutChangingAssignment(int requestedCap) throws Exception {
		Assignment before = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, 2, false);

		mockMvc.perform(putAssignment(before.getId(), "{\"maxSubmissions\":" + requestedCap + "}")
					.header(HttpHeaders.AUTHORIZATION, bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest());
		assertThat(reloadAssignment(before.getId())).usingRecursiveComparison().isEqualTo(before);
	}

	@Test
	void rejectsDecimalCapAndKeepsAssignmentUnchanged() throws Exception {
		Assignment before = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, 3, false);
		String authorization = bearer(teacherId, UserRole.TEACHER);
		mockMvc.perform(putAssignment(before.getId(), "{\"maxSubmissions\":1.5,\"title\":\"Should not be saved\"}")
					.header(HttpHeaders.AUTHORIZATION, authorization))
				.andExpect(status().isBadRequest());

		assertThat(reloadAssignment(before.getId())).usingRecursiveComparison().isEqualTo(before);
		mockMvc.perform(get("/api/v1/assignments/{id}", before.getId())
					.header(HttpHeaders.AUTHORIZATION, authorization))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.maxSubmissions").value(3));
	}

	@ParameterizedTest
	@ValueSource(booleans = {false, true})
	@EnabledIfEnvironmentVariable(named = "BE84_DISPOSABLE_DB", matches = "true")
	void serializesCapReductionAndStartingNextAttempt(boolean startFirst) throws Exception {
		Long id = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, 2, false).getId();
		submissionRepository.save(new Submission(id, studentId, 1, TEST_NOW.minusHours(1), SubmissionStatus.SUBMITTED));
		String teacherAuthorization = bearer(teacherId, UserRole.TEACHER);
		var start = post("/api/v1/assignments/{id}/submissions", id)
				.header(HttpHeaders.AUTHORIZATION, bearer(studentId, UserRole.STUDENT));
		var reduce = putAssignment(id, "{\"maxSubmissions\":1}")
				.header(HttpHeaders.AUTHORIZATION, teacherAuthorization);

		if (startFirst) {
			MvcResult blockedUpdate = performOverlappingWrites(id, start, 201, reduce);
			status().isOk().match(blockedUpdate);
			jsonPath("$.maxSubmissions").value(1).match(blockedUpdate);
		} else {
			MvcResult blockedStart = performOverlappingWrites(id, reduce, 200, start);
			status().isBadRequest().match(blockedStart);
			jsonPath("$.error").value("Không thể bắt đầu làm bài tập này lúc này.").match(blockedStart);
		}

		assertThat(assignmentRepository.findById(id).orElseThrow().getMaxSubmissions()).isEqualTo(1);
		mockMvc.perform(get("/api/v1/submissions")
					.param("assignmentId", id.toString())
					.header(HttpHeaders.AUTHORIZATION, teacherAuthorization))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pagination.total").value(startFirst ? 2 : 1));
	}

	@Test
	@EnabledIfEnvironmentVariable(named = "BE84_DISPOSABLE_DB", matches = "true")
	void statusUpdatePreservesDetailsFromAnOverlappingPut() throws Exception {
		Long id = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, 2, false).getId();
		OffsetDateTime newCloseAt = FUTURE_CLOSE_AT.plusDays(1);
		String authorization = bearer(teacherId, UserRole.TEACHER);
		var edit = putAssignment(id, "{\"title\":\"Concurrent edit\",\"closeAt\":\"" + newCloseAt + "\"}")
				.header(HttpHeaders.AUTHORIZATION, authorization);
		var close = patchStatus(id, statusBody(AssignmentStatus.CLOSED, null))
				.header(HttpHeaders.AUTHORIZATION, authorization);

		assertThat(performOverlappingWrites(id, edit, 200, close).getResponse().getStatus()).isEqualTo(200);

		Assignment stored = assignmentRepository.findById(id).orElseThrow();
		assertThat(stored.getStatus()).isEqualTo(AssignmentStatus.CLOSED);
		assertThat(stored.getTitle()).isEqualTo("Concurrent edit");
		assertThat(stored.getCloseAt().toInstant()).isEqualTo(newCloseAt.toInstant());
	}

	private MvcResult performOverlappingWrites(Long id, MockHttpServletRequestBuilder firstRequest,
			int expectedFirstStatus, MockHttpServletRequestBuilder secondRequest) throws Exception {
		assertThat(assignmentRepository).isInstanceOf(Advised.class);
		Advised repositoryProxy = (Advised) assignmentRepository;
		assertThat(repositoryProxy.isFrozen()).isFalse();

		// The disposable database is required because both request threads need committed fixtures.
		TestTransaction.flagForCommit();
		TestTransaction.end();
		CountDownLatch firstWriteApplied = new CountDownLatch(1);
		CountDownLatch allowCommit = new CountDownLatch(1);
		CountDownLatch secondReachedRepository = new CountDownLatch(1);
		CountDownLatch firstCommitted = new CountDownLatch(1);
		AtomicReference<Thread> secondWorker = new AtomicReference<>();
		MethodInterceptor observeSecondWrite = invocation -> {
			if (Thread.currentThread() == secondWorker.get()
					&& invocation.getMethod().getName().equals("findByIdForUpdate")
					&& id.equals(invocation.getArguments()[0])) {
				secondReachedRepository.countDown();
				assertThat(firstCommitted.await(10, TimeUnit.SECONDS)).isTrue();
			}
			return invocation.proceed();
		};
		repositoryProxy.addAdvice(0, observeSecondWrite);
		ExecutorService executor = Executors.newFixedThreadPool(2);
		try {
			Future<?> first = executor.submit(() -> raceTransaction.executeWithoutResult(transaction -> {
				int statusCode = performRequest(firstRequest).getResponse().getStatus();
				firstWriteApplied.countDown();
				assertThat(statusCode).isEqualTo(expectedFirstStatus);
				try {
					assertThat(allowCommit.await(10, TimeUnit.SECONDS)).isTrue();
				} catch (InterruptedException exception) {
					Thread.currentThread().interrupt();
					throw new IllegalStateException(exception);
				}
			}));
			assertThat(firstWriteApplied.await(10, TimeUnit.SECONDS)).isTrue();
			Future<MvcResult> second = executor.submit(() -> {
				secondWorker.set(Thread.currentThread());
				return performRequest(secondRequest);
			});
			assertThat(secondReachedRepository.await(10, TimeUnit.SECONDS))
					.as("second request reached the assignment lock repository").isTrue();
			assertThatThrownBy(() -> raceTransaction.executeWithoutResult(transaction ->
					entityManager.find(Assignment.class, id, LockModeType.PESSIMISTIC_WRITE,
							Map.of("jakarta.persistence.lock.timeout", 0))))
					.as("first request holds the assignment row lock")
					.isInstanceOfAny(LockTimeoutException.class, PessimisticLockException.class);
			allowCommit.countDown();
			first.get(10, TimeUnit.SECONDS);
			firstCommitted.countDown();
			return second.get(10, TimeUnit.SECONDS);
		} finally {
			allowCommit.countDown();
			firstCommitted.countDown();
			executor.shutdownNow();
			try {
				assertThat(executor.awaitTermination(10, TimeUnit.SECONDS)).isTrue();
			} finally {
				repositoryProxy.removeAdvice(observeSecondWrite);
			}
		}
	}

	private MvcResult performRequest(MockHttpServletRequestBuilder request) {
		try {
			return mockMvc.perform(request).andReturn();
		} catch (Exception exception) {
			throw new IllegalStateException(exception);
		}
	}

	@ParameterizedTest
	@NullSource
	@EnumSource(value = UserRole.class, names = {"STUDENT", "ADMIN", "TEACHER"})
	void rejectsReopenAndCapUpdateWithoutOwnership(UserRole role) throws Exception {
		Assignment closed = saveBe84Assignment(AssignmentStatus.CLOSED, FUTURE_CLOSE_AT, 2, false);
		Assignment published = saveBe84Assignment(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT, 2, false);
		var reopen = patchStatus(closed.getId(), statusBody(AssignmentStatus.PUBLISHED, FUTURE_CLOSE_AT.plusDays(1)));
		var update = putAssignment(published.getId(), "{\"maxSubmissions\":1}");
		if (role != null) {
			Long callerId = switch (role) {
				case STUDENT -> studentId;
				case ADMIN -> adminId;
				case TEACHER -> otherTeacherId;
			};
			String authorization = bearer(callerId, role);
			reopen.header(HttpHeaders.AUTHORIZATION, authorization);
			update.header(HttpHeaders.AUTHORIZATION, authorization);
		}

		int expectedStatus = role == null ? 401 : 403;
		mockMvc.perform(reopen).andExpect(status().is(expectedStatus));
		mockMvc.perform(update).andExpect(status().is(expectedStatus));
		assertThat(reloadAssignment(closed.getId())).usingRecursiveComparison().isEqualTo(closed);
		assertThat(reloadAssignment(published.getId())).usingRecursiveComparison().isEqualTo(published);
	}

	@ParameterizedTest
	@ValueSource(booleans = {false, true})
	void rejectsStatusAndCapUpdatesForMissingOrDeletedAssignment(boolean deleted) throws Exception {
		Assignment deletedAssignment = deleted ? saveBe84Assignment(AssignmentStatus.CLOSED, FUTURE_CLOSE_AT, 2, true) : null;
		long id = deleted ? deletedAssignment.getId() : -assignmentId;
		String authorization = bearer(teacherId, UserRole.TEACHER);

		mockMvc.perform(patchStatus(id, statusBody(AssignmentStatus.PUBLISHED, null))
					.header(HttpHeaders.AUTHORIZATION, authorization))
				.andExpect(status().isNotFound());
		mockMvc.perform(putAssignment(id, "{\"maxSubmissions\":1}")
					.header(HttpHeaders.AUTHORIZATION, authorization))
				.andExpect(status().isNotFound());
		if (deleted) {
			assertThat(reloadAssignment(id)).usingRecursiveComparison().isEqualTo(deletedAssignment);
		}
	}

	@ParameterizedTest
	@EnumSource(value = AssignmentStatus.class, names = {"DRAFT", "PUBLISHED"})
	void getAndUpdateResponsesIncludeMaxSubmissions(AssignmentStatus initialStatus) throws Exception {
		Long id = saveBe84Assignment(initialStatus, FUTURE_CLOSE_AT, 1, false).getId();
		mockMvc.perform(get("/api/v1/assignments/{id}", id)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isOk())
				.andExpect(jsonPath("$.maxSubmissions").value(1));

		mockMvc.perform(put("/api/v1/assignments/{id}", id)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"maxSubmissions\":3}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("Cập nhật bài tập thành công."))
			.andExpect(jsonPath("$.maxSubmissions").value(3));

		entityManager.flush();
		entityManager.clear();

		mockMvc.perform(get("/api/v1/assignments/{id}", id)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxSubmissions").value(3));
		assertThat(assignmentRepository.findById(id).orElseThrow().getMaxSubmissions()).isEqualTo(3);
	}

	@Test
	void updateWithoutMaxSubmissionsReturnsAndKeepsStoredValue() throws Exception {
		mockMvc.perform(put("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"title\":\"Updated title without max submissions\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxSubmissions").value(2));

		entityManager.flush();
		entityManager.clear();

		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxSubmissions").value(2));
	}

	@Test
	void getAndUpdateResponsesKeepNullMaxSubmissions() throws Exception {
		Assignment assignmentWithoutMaxSubmissions = assignmentRepository.save(new Assignment(
				classId,
				"Assignment without max submissions",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				null,
				false,
				AssignmentStatus.DRAFT));

		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentWithoutMaxSubmissions.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxSubmissions").hasJsonPath())
			.andExpect(jsonPath("$.maxSubmissions").value(nullValue()));

		mockMvc.perform(put("/api/v1/assignments/{id}", assignmentWithoutMaxSubmissions.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"title\":\"Updated assignment without max submissions\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("Cập nhật bài tập thành công."))
			.andExpect(jsonPath("$.maxSubmissions").hasJsonPath())
			.andExpect(jsonPath("$.maxSubmissions").value(nullValue()));
	}

	@Test
	void deleteIsSoftAndStatusCannotMoveBackwards() throws Exception {
		mockMvc.perform(patch("/api/v1/assignments/{id}/status", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"status\":\"CLOSED\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể chuyển sang trạng thái này."));

		mockMvc.perform(delete("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
		mockMvc.perform(delete("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
		mockMvc.perform(delete("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá bài tập."));
		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isNotFound());
	}

	@Test
	void studentListFiltersDraftBeforePaginationAndCount() throws Exception {
		Assignment firstPublished = saveAssignmentFromFixture(classId, AssignmentStatus.PUBLISHED, false);
		saveAssignmentFromFixture(classId, AssignmentStatus.PUBLISHED, true);
		Assignment closed = saveAssignmentFromFixture(classId, AssignmentStatus.CLOSED, false);
		saveAssignmentFromFixture(classId, AssignmentStatus.DRAFT, false);
		Assignment lastPublished = saveAssignmentFromFixture(classId, AssignmentStatus.PUBLISHED, false);
		Long otherClassId = createStudentClass();
		saveAssignmentFromFixture(otherClassId, AssignmentStatus.PUBLISHED, false);
		entityManager.flush();
		entityManager.clear();

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.param("page", "1").param("limit", "2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.data[0].id").value(lastPublished.getId()))
				.andExpect(jsonPath("$.data[0].status").value("PUBLISHED"))
				.andExpect(jsonPath("$.data[1].id").value(closed.getId()))
				.andExpect(jsonPath("$.data[1].status").value("CLOSED"))
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(2))
				.andExpect(jsonPath("$.pagination.total").value(3));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.param("page", "2").param("limit", "2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(firstPublished.getId()))
				.andExpect(jsonPath("$.data[0].status").value("PUBLISHED"))
				.andExpect(jsonPath("$.pagination.page").value(2))
				.andExpect(jsonPath("$.pagination.limit").value(2))
				.andExpect(jsonPath("$.pagination.total").value(3));
	}

	@ParameterizedTest
	@EnumSource(value = AssignmentStatus.class, names = {"PUBLISHED", "CLOSED"})
	void studentCanFilterVisibleAssignmentStatuses(AssignmentStatus assignmentStatus) throws Exception {
		Assignment visible = saveAssignmentFromFixture(classId, assignmentStatus, false);

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.param("status", assignmentStatus.name()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(visible.getId()))
				.andExpect(jsonPath("$.data[0].status").value(assignmentStatus.name()))
				.andExpect(jsonPath("$.pagination.total").value(1));
	}

	@ParameterizedTest
	@ValueSource(strings = {"DRAFT", "draft", " Draft "})
	void studentDraftFiltersReturnForbidden(String statusValue) throws Exception {
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.param("status", statusValue))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."));
	}

	@ParameterizedTest
	@EnumSource(value = AssignmentStatus.class, names = {"PUBLISHED", "CLOSED"})
	void studentVisibleAssignmentDetailRemainsReadable(AssignmentStatus assignmentStatus) throws Exception {
		Assignment visible = saveAssignmentFromFixture(classId, assignmentStatus, false);

		mockMvc.perform(get("/api/v1/assignments/{id}", visible.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(visible.getId()))
				.andExpect(jsonPath("$.status").value(assignmentStatus.name()))
				.andExpect(jsonPath("$.modules").isArray());
	}

	@ParameterizedTest
	@ValueSource(booleans = {true, false})
	void studentEmptyAndDraftOnlyClassesReturnEmptyPage(boolean draftOnly) throws Exception {
		Long targetClassId = draftOnly ? classId : createStudentClass();

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", targetClassId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)))
				.andExpect(jsonPath("$.pagination.total").value(0));
	}

	@ParameterizedTest
	@MethodSource("assignmentListValidationCases")
	void assignmentListValidationPrecedenceIsPreserved(
			String statusValue, String page, String limit, String scope, int expectedStatus, String message)
			throws Exception {
		Long targetClassId = "MISSING_CLASS".equals(scope) ? 999_999_999L : classId;
		Long callerId = "OUTSIDE_CLASS".equals(scope) ? otherStudentId : studentId;
		var request = get("/api/v1/classes/{id}/assignments", targetClassId)
				.header("Authorization", bearer(callerId, UserRole.STUDENT))
				.param("page", page).param("limit", limit);
		if (statusValue != null) {
			request.param("status", statusValue);
		}

		mockMvc.perform(request)
				.andExpect(status().is(expectedStatus))
				.andExpect(jsonPath("$.error").value(message));
	}

	@ParameterizedTest
	@ValueSource(strings = {"LIST", "DETAIL"})
	void assignmentReadRoutesRequireAuthentication(String route) throws Exception {
		String path = "LIST".equals(route) ? "/api/v1/classes/{id}/assignments" : "/api/v1/assignments/{id}";
		Long id = "LIST".equals(route) ? classId : assignmentId;

		mockMvc.perform(get(path, id))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));
	}

	@Test
	void deletedAssignmentDetailRemainsNotFound() throws Exception {
		Assignment deleted = saveAssignmentFromFixture(classId, AssignmentStatus.DRAFT, true);
		entityManager.flush();
		entityManager.clear();

		mockMvc.perform(get("/api/v1/assignments/{id}", deleted.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy bài tập."));
	}

	@ParameterizedTest
	@EnumSource(value = UserRole.class, names = {"ADMIN", "TEACHER"})
	void adminAndOwnerCanStillFilterDraftAssignments(UserRole role) throws Exception {
		Long callerId = role == UserRole.ADMIN ? adminId : teacherId;

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(callerId, role))
					.param("status", "DRAFT"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(assignmentId))
				.andExpect(jsonPath("$.data[0].status").value("DRAFT"))
				.andExpect(jsonPath("$.pagination.total").value(1));
	}

	private static Stream<Arguments> assignmentListValidationCases() {
		String invalidData = "Dữ liệu không hợp lệ.";
		String invalidStatus = "status không hợp lệ.";
		return Stream.of(
				Arguments.of("DRAFT", "0", "20", "MEMBER", 400, invalidData),
				Arguments.of("DRAFT", "1", "0", "MEMBER", 400, invalidData),
				Arguments.of("DRAFT", "1", "101", "MEMBER", 400, invalidData),
				Arguments.of("OPEN", "0", "20", "MEMBER", 400, invalidStatus),
				Arguments.of("OPEN", "1", "0", "MEMBER", 400, invalidStatus),
				Arguments.of("OPEN", "1", "101", "MEMBER", 400, invalidStatus),
				Arguments.of("OPEN", "0", "0", "MEMBER", 400, invalidStatus),
				Arguments.of(null, "0", "20", "MEMBER", 400, invalidData),
				Arguments.of(null, "1", "0", "MEMBER", 400, invalidData),
				Arguments.of(null, "1", "101", "MEMBER", 400, invalidData),
				Arguments.of("", "0", "20", "MEMBER", 400, invalidData),
				Arguments.of("", "1", "0", "MEMBER", 400, invalidData),
				Arguments.of("", "1", "101", "MEMBER", 400, invalidData),
				Arguments.of("   ", "0", "20", "MEMBER", 400, invalidData),
				Arguments.of("   ", "1", "0", "MEMBER", 400, invalidData),
				Arguments.of("   ", "1", "101", "MEMBER", 400, invalidData),
				Arguments.of("DRAFT", "0", "0", "OUTSIDE_CLASS", 403, "Bạn không có quyền thực hiện thao tác này."),
				Arguments.of("OPEN", "0", "0", "OUTSIDE_CLASS", 403, "Bạn không có quyền thực hiện thao tác này."),
				Arguments.of("DRAFT", "0", "0", "MISSING_CLASS", 404, "Không tìm thấy lớp học."),
				Arguments.of("OPEN", "0", "0", "MISSING_CLASS", 404, "Không tìm thấy lớp học."),
				Arguments.of("DRAFT", "abc", "20", "MEMBER", 400, invalidData),
				Arguments.of("DRAFT", "1", "abc", "MEMBER", 400, invalidData));
	}

	private Assignment saveBe84Assignment(AssignmentStatus status, OffsetDateTime closeAt, Integer cap, boolean deleted) {
		Assignment assignment = assignmentRepository.saveAndFlush(new Assignment(
				classId, "Assignment policy " + uniqueSuffix(), "Instructions", OPEN_AT, closeAt, cap, deleted, status));
		entityManager.refresh(assignment);
		entityManager.detach(assignment);
		return assignment;
	}

	private Assignment reloadAssignment(Long id) {
		entityManager.flush();
		entityManager.clear();
		return assignmentRepository.findById(id).orElseThrow();
	}

	private static MockHttpServletRequestBuilder patchStatus(Long id, String body) {
		return patch("/api/v1/assignments/{id}/status", id).contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static MockHttpServletRequestBuilder putAssignment(Long id, String body) {
		return put("/api/v1/assignments/{id}", id).contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String statusBody(AssignmentStatus target, OffsetDateTime closeAt) {
		if (closeAt == null) {
			return "{\"status\":\"" + target + "\"}";
		}
		return "{\"status\":\"" + target + "\",\"closeAt\":\"" + closeAt + "\"}";
	}

	private Assignment saveAssignmentFromFixture(Long targetClassId, AssignmentStatus assignmentStatus, boolean deleted) {
		Assignment fixture = assignmentRepository.findById(assignmentId).orElseThrow();
		return assignmentRepository.save(new Assignment(
				targetClassId,
				fixture.getTitle(),
				fixture.getDescription(),
				fixture.getOpenAt(),
				fixture.getCloseAt(),
				fixture.getMaxSubmissions(),
				deleted,
				assignmentStatus));
	}

	private Long createStudentClass() {
		ClassEntity fixture = classRepository.findById(classId).orElseThrow();
		ClassEntity emptyClass = classRepository.save(new ClassEntity(
				fixture.getName() + " " + uniqueSuffix(),
				fixture.getLevel(),
				fixture.getDescription(),
				fixture.getStartDate(),
				fixture.getEndDate(),
				fixture.getStatus(),
				fixture.getTeacherId()));
		classMemberRepository.save(new ClassMemberEntity(emptyClass.getId(), studentId));
		return emptyClass.getId();
	}

	private Long createUser(UserRole role, String name) {
		User user = new User(
				name + " " + uniqueSuffix(),
				role.name().toLowerCase() + "-" + uniqueSuffix() + "@englishhub.test",
				"0912345678",
				"hash",
				role,
				UserStatus.ACTIVE,
				false);
		return userRepository.save(user).getId();
	}

	private User findUser(Long userId) {
		return userRepository.findById(userId).orElseThrow();
	}

	private String bearer(Long userId, UserRole role) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
		return "Bearer " + jwtTokenService.createAccessToken(userId, tokenRole);
	}

	private String validCreateBody() {
		return "{\"title\":\"New assignment\",\"description\":\"Instructions\","
				+ "\"openAt\":\"2026-09-15T00:00:00Z\","
				+ "\"closeAt\":\"2026-09-20T23:59:00Z\",\"maxSubmissions\":2}";
	}

	private String uniqueSuffix() {
		return UUID.randomUUID().toString().substring(0, 8);
	}

	@TestConfiguration(proxyBeanMethods = false)
	static class FixedClockConfiguration {

		@Bean
		@Primary
		AssignmentService assignmentServiceWithFixedClock(
				com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository assignmentRepository,
				ClassRepository classRepository, CurrentUserProvider currentUserProvider) throws NoSuchMethodException {
			var constructor = AssignmentService.class.getDeclaredConstructor(
					com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository.class,
					ClassRepository.class, CurrentUserProvider.class, Clock.class);
			Clock clock = Clock.fixed(TEST_NOW.toInstant(), ZoneOffset.UTC);
			return BeanUtils.instantiateClass(constructor, assignmentRepository, classRepository, currentUserProvider, clock);
		}
	}
}
