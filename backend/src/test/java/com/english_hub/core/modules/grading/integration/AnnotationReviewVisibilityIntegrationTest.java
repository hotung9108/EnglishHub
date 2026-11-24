package com.english_hub.core.modules.grading.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.AnnotationSource;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.AnswerAnnotation;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ClassMember;
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
import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * FE-48 BE reproduction, using the real security chain, controller, service and repositories.
 * All users, classes, answers and annotations below are synthetic test data, NOT CSV fixtures.
 * Generated IDs are used throughout. Each test rolls back; PostgreSQL belongs to this class only.
 * JWTs are generated for persisted active users, following GradingApiIntegrationTest (no login API).
 * No AI endpoint, application database, native query or new migration is used.
 * Assertions always describe the required behavior; red predictions are not expected failures.
 */
@Testcontainers
@SpringBootTest(properties = {
		"spring.flyway.enabled=true",
		"spring.jpa.hibernate.ddl-auto=validate"
})
@ActiveProfiles("fe48-annotation-reproduce")
@AutoConfigureMockMvc
@Transactional
class AnnotationReviewVisibilityIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_fe48_annotation_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	private static final String ANSWER_TEXT = "I practise English every day and review the words I learn.";
	private static final long MISSING_ID = Long.MAX_VALUE;
	private final MockMvc mockMvc;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final ClassJpaRepository classRepository;
	private final AssignmentRepository assignmentRepository;
	private final AssignmentModuleRepository moduleRepository;
	private final ClassMemberRepository classMemberRepository;
	private final SubmissionRepository submissionRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final AnswerRepository answerRepository;
	private final AnswerAnnotationRepository annotationRepository;
	private final EntityManager entityManager;
	private final JwtTokenService jwtTokenService;
	private final ObjectMapper objectMapper;
	private long teacherId;
	private long otherTeacherId;
	private long studentId;
	private long otherStudentId;
	private long adminId;
	private long answerId;

	@Autowired
	AnnotationReviewVisibilityIntegrationTest(
			MockMvc mockMvc, UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository, StudentProfileRepository studentProfileRepository,
			ClassJpaRepository classRepository, AssignmentRepository assignmentRepository,
			AssignmentModuleRepository moduleRepository, ClassMemberRepository classMemberRepository,
			SubmissionRepository submissionRepository, SubmissionModuleRepository submissionModuleRepository,
			AnswerRepository answerRepository, AnswerAnnotationRepository annotationRepository,
			EntityManager entityManager, JwtTokenService jwtTokenService, ObjectMapper objectMapper) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.classRepository = classRepository;
		this.assignmentRepository = assignmentRepository;
		this.moduleRepository = moduleRepository;
		this.classMemberRepository = classMemberRepository;
		this.submissionRepository = submissionRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.answerRepository = answerRepository;
		this.annotationRepository = annotationRepository;
		this.entityManager = entityManager;
		this.jwtTokenService = jwtTokenService;
		this.objectMapper = objectMapper;
	}

	@BeforeEach
	void createSyntheticOwnershipChain() {
		teacherId = createUser(UserRole.TEACHER, "Annotation owner teacher");
		otherTeacherId = createUser(UserRole.TEACHER, "Annotation other teacher");
		studentId = createUser(UserRole.STUDENT, "Annotation owner student");
		otherStudentId = createUser(UserRole.STUDENT, "Annotation classmate");
		adminId = createUser(UserRole.ADMIN, "Annotation admin");
		for (long id : List.of(teacherId, otherTeacherId)) {
			teacherProfileRepository.save(new TeacherProfile(userRepository.findById(id).orElseThrow(), "English"));
		}
		for (long id : List.of(studentId, otherStudentId)) {
			studentProfileRepository.save(new StudentProfile(userRepository.findById(id).orElseThrow(),
					"AN-" + UUID.randomUUID().toString().substring(0, 10), LocalDate.of(2004, 3, 4), null));
		}
		long classId = classRepository.save(new ClassEntity(
				"FE-48 synthetic class " + UUID.randomUUID(), "Intermediate", "Synthetic annotation test data",
				LocalDate.of(2026, 9, 1), null, ClassStatus.ACTIVE, teacherId)).getId();
		classMemberRepository.save(new ClassMember(classId, studentId));
		classMemberRepository.save(new ClassMember(classId, otherStudentId));
		long assignmentId = assignmentRepository.save(new Assignment(
				classId, "FE-48 synthetic assignment", "Annotation review reproduction",
				OffsetDateTime.parse("2026-09-10T00:00:00Z"), OffsetDateTime.parse("2026-09-30T00:00:00Z"),
				2, false, AssignmentStatus.PUBLISHED)).getId();
		long moduleId = moduleRepository.save(new AssignmentModule(
				assignmentId, ModuleSkill.WRITING, ModuleTaskType.ESSAY, 1, "Write an essay",
				new BigDecimal("10.00"), null, null, null, null, "Review the essay")).getId();
		long submissionId = submissionRepository.save(new Submission(
				assignmentId, studentId, 1, OffsetDateTime.parse("2026-09-15T12:00:00Z"),
				SubmissionStatus.SUBMITTED)).getId();
		long submissionModuleId = submissionModuleRepository.save(new SubmissionModule(
				submissionId, moduleId, SubmissionStatus.SUBMITTED)).getId();
		answerId = answerRepository.save(new Answer(submissionModuleId, null, ANSWER_TEXT,
				null, null, null, null, null, null, null, null, null)).getId();
		flushAndClear();
	}

	/**
	 * MAIN/SECONDARY/EDGE: synthetic mixed, hidden-only, empty, teacher-only or accepted-only lists.
	 * Expected: only ACCEPTED, including the teacher note created through POST, in ascending ID order.
	 * Current prediction: FAIL for MIXED/HIDDEN_ONLY (B1); PASS for the other three variants.
	 */
	@ParameterizedTest(name = "B1 student visibility: {0}")
	@ValueSource(strings = {"MIXED", "HIDDEN_ONLY", "EMPTY", "TEACHER_ONLY", "ACCEPTED_ONLY"})
	void studentReceivesOnlyAcceptedAnnotations(String scenario) throws Exception {
		List<AnswerAnnotation> expected = new ArrayList<>();
		if (scenario.equals("MIXED") || scenario.equals("HIDDEN_ONLY")) {
			saveAiAnnotation(ReviewStatus.PENDING);
			if (scenario.equals("MIXED")) expected.add(saveAiAnnotation(ReviewStatus.ACCEPTED));
			saveAiAnnotation(ReviewStatus.REJECTED);
		}
		if (scenario.equals("MIXED") || scenario.equals("TEACHER_ONLY")) {
			expected.add(createTeacherAnnotation("GRAMMAR"));
		}
		if (scenario.equals("MIXED") || scenario.equals("ACCEPTED_ONLY")) {
			expected.add(saveAiAnnotation(ReviewStatus.ACCEPTED));
		}
		if (scenario.equals("ACCEPTED_ONLY")) expected.add(saveAiAnnotation(ReviewStatus.ACCEPTED));
		flushAndClear();
		assertAnnotationList(listAs(studentId, UserRole.STUDENT), expected);
	}

	/** CONTROL: synthetic AI rows in all three states plus a default ACCEPTED teacher note.
	 * Expected/current prediction: PASS; owning teacher sees all four, sorted, with the same shape.
	 */
	@Test
	void owningTeacherStillReceivesEveryReviewStatus() throws Exception {
		List<AnswerAnnotation> expected = new ArrayList<>();
		expected.add(saveAiAnnotation(ReviewStatus.PENDING));
		expected.add(saveAiAnnotation(ReviewStatus.REJECTED));
		expected.add(createTeacherAnnotation("GRAMMAR"));
		expected.add(saveAiAnnotation(ReviewStatus.ACCEPTED));
		flushAndClear();
		assertAnnotationList(listAs(teacherId, UserRole.TEACHER), expected);
	}

	/** CONTROL/EDGE: one synthetic AI/PENDING row and a non-owner, Admin or anonymous caller.
	 * Expected/current prediction: PASS; all four operations are 403, or 401 without authentication.
	 * The other student is in the SAME class, so membership must not grant access to a peer's answer.
	 */
	@ParameterizedTest(name = "Ownership and route controls: {0}")
	@ValueSource(strings = {"OTHER_TEACHER", "OTHER_STUDENT", "ADMIN", "ANONYMOUS"})
	void blockedCallersCannotReadOrMutateAnnotations(String caller) throws Exception {
		AnswerAnnotation annotation = saveAiAnnotation(ReviewStatus.PENDING);
		flushAndClear();
		Long callerId = switch (caller) {
			case "OTHER_TEACHER" -> otherTeacherId;
			case "OTHER_STUDENT" -> otherStudentId;
			case "ADMIN" -> adminId;
			default -> null;
		};
		UserRole role = switch (caller) {
			case "OTHER_TEACHER" -> UserRole.TEACHER;
			case "OTHER_STUDENT" -> UserRole.STUDENT;
			case "ADMIN" -> UserRole.ADMIN;
			default -> null;
		};
		int expectedStatus = callerId == null ? 401 : 403;
		assertAll(List.of(Operation.values()).stream().map(operation -> (org.junit.jupiter.api.function.Executable) () ->
				assertError(call(operation, operation.answerRoute ? answerId : annotation.getId(), callerId, role,
						defaultBody(operation)), expectedStatus)));
		assertThat(annotationRepository.findByAnswerIdOrderByIdAsc(answerId)).hasSize(1);
		assertThat(annotationRepository.findById(annotation.getId()).orElseThrow().getReviewStatus())
				.isEqualTo(ReviewStatus.PENDING);
	}

	/** CONTROL: owner student plus a synthetic AI/PENDING row; ownership does not grant write access.
	 * Expected/current prediction: PASS; POST/PATCH/DELETE are 403 and the row remains PENDING.
	 */
	@Test
	void owningStudentCannotCreateReviewOrDeleteAnnotations() throws Exception {
		AnswerAnnotation annotation = saveAiAnnotation(ReviewStatus.PENDING);
		flushAndClear();
		assertAll(List.of(Operation.CREATE, Operation.REVIEW, Operation.DELETE).stream()
				.map(operation -> (org.junit.jupiter.api.function.Executable) () -> assertError(call(operation,
						operation.answerRoute ? answerId : annotation.getId(), studentId, UserRole.STUDENT,
						defaultBody(operation)), 403)));
		assertThat(annotationRepository.findById(annotation.getId()).orElseThrow().getReviewStatus())
				.isEqualTo(ReviewStatus.PENDING);
	}

	/** CONTROL/EDGE: no annotation and verified absent sentinel IDs, with the owning teacher token.
	 * Expected/current prediction: PASS; both readers get 404 for a missing answer, as do teacher writes.
	 */
	@Test
	void nonexistentAnswerAndAnnotationIdsReturnNotFound() throws Exception {
		assertThat(answerRepository.existsById(MISSING_ID)).isFalse();
		assertThat(annotationRepository.existsById(MISSING_ID)).isFalse();
		assertAll(List.of(Operation.values()).stream().map(operation -> (org.junit.jupiter.api.function.Executable) () ->
				assertError(call(operation, MISSING_ID, teacherId, UserRole.TEACHER, defaultBody(operation)), 404)));
		assertError(call(Operation.LIST, MISSING_ID, studentId, UserRole.STUDENT, null), 404);
	}

	/** CONTROL/MAIN: synthetic AI/PENDING, PATCH to ACCEPTED, flush/clear, then student GET.
	 * Expected/current prediction: PASS; visible immediately, mutation body stays {message}, content unchanged.
	 */
	@Test
	void acceptingPendingAnnotationMakesItVisibleImmediately() throws Exception {
		AnswerAnnotation annotation = saveAiAnnotation(ReviewStatus.PENDING);
		// Detach the baseline so a managed entity update cannot change our expected content too.
		flushAndClear();
		review(annotation.getId(), "ACCEPTED");
		AnswerAnnotation accepted = annotationRepository.findById(annotation.getId()).orElseThrow();
		assertThat(accepted.getReviewStatus()).isEqualTo(ReviewStatus.ACCEPTED);
		assertThat(accepted.getAnswerId()).isEqualTo(annotation.getAnswerId());
		assertThat(accepted.getSource()).isEqualTo(annotation.getSource());
		assertThat(accepted.getErrorType()).isEqualTo(annotation.getErrorType());
		assertThat(accepted.getComment()).isEqualTo(annotation.getComment());
		assertThat(accepted.getSuggestedFix()).isEqualTo(annotation.getSuggestedFix());
		assertThat(accepted.getStartOffset()).isEqualTo(annotation.getStartOffset());
		assertThat(accepted.getEndOffset()).isEqualTo(annotation.getEndOffset());
		assertAnnotationList(listAs(studentId, UserRole.STUDENT), List.of(accepted));
	}

	/** B1/MAIN: synthetic PENDING -> ACCEPTED (visible) -> REJECTED, each through PATCH.
	 * Expected: subsequent student GET is empty. Current prediction: FAIL; REJECTED remains in data.
	 */
	@Test
	void rejectingPreviouslyAcceptedAnnotationRemovesItFromStudentList() throws Exception {
		AnswerAnnotation annotation = saveAiAnnotation(ReviewStatus.PENDING);
		review(annotation.getId(), "ACCEPTED");
		assertAnnotationList(listAs(studentId, UserRole.STUDENT),
				List.of(annotationRepository.findById(annotation.getId()).orElseThrow()));
		review(annotation.getId(), "REJECTED");
		assertThat(annotationRepository.findById(annotation.getId()).orElseThrow().getReviewStatus())
				.isEqualTo(ReviewStatus.REJECTED);
		assertAnnotationList(listAs(studentId, UserRole.STUDENT), List.of());
	}

	/** CONTROL/EDGE: synthetic answer, negative/reversed/out-of-bounds or missing offsets in POST.
	 * Expected/current prediction: PASS; 400 with {error}, without creating any annotation.
	 */
	@ParameterizedTest(name = "Invalid POST offsets: {0}, {1}")
	@CsvSource(value = {"-1,5", "5,2", "0,9999", "NULL,5", "0,NULL"}, nullValues = "NULL")
	void invalidCreateOffsetsReturnBadRequest(Integer start, Integer end) throws Exception {
		Map<String, Object> body = new java.util.HashMap<>();
		body.put("startOffset", start);
		body.put("endOffset", end);
		assertError(call(Operation.CREATE, answerId, teacherId, UserRole.TEACHER,
				objectMapper.writeValueAsString(body)), 400);
		assertThat(annotationRepository.findByAnswerIdOrderByIdAsc(answerId)).isEmpty();
	}

	/** CONTROL/EDGE: synthetic AI/PENDING and a missing/null/blank/unsupported review status.
	 * Expected/current prediction: PASS; 400, with the persisted status still PENDING.
	 */
	@ParameterizedTest(name = "Invalid PATCH review body: {0}")
	@ValueSource(strings = {"{}", "{\"reviewStatus\":null}", "{\"reviewStatus\":\"\"}",
			"{\"reviewStatus\":\"PENDING\"}", "{\"reviewStatus\":\"UNKNOWN\"}"})
	void invalidReviewStatusesReturnBadRequest(String body) throws Exception {
		AnswerAnnotation annotation = saveAiAnnotation(ReviewStatus.PENDING);
		flushAndClear();
		assertError(call(Operation.REVIEW, annotation.getId(), teacherId, UserRole.TEACHER, body), 400);
		assertThat(annotationRepository.findById(annotation.getId()).orElseThrow().getReviewStatus())
				.isEqualTo(ReviewStatus.PENDING);
	}

	/** CONTROL: POST creates a synthetic TEACHER/ACCEPTED note; PATCH review is only for AI.
	 * Expected/current prediction: PASS; 400, with the teacher note still ACCEPTED.
	 */
	@Test
	void teacherAuthoredAnnotationCannotBeReviewedAsAi() throws Exception {
		AnswerAnnotation annotation = createTeacherAnnotation("GRAMMAR");
		assertError(call(Operation.REVIEW, annotation.getId(), teacherId, UserRole.TEACHER,
				"{\"reviewStatus\":\"REJECTED\"}"), 400);
		assertThat(annotationRepository.findById(annotation.getId()).orElseThrow().getReviewStatus())
				.isEqualTo(ReviewStatus.ACCEPTED);
	}

	/** CONTROL: synthetic AI or default TEACHER note, deleted by the owning teacher.
	 * Expected/current prediction: PASS; 200 {message}, persisted deletion and empty GETs for both roles.
	 */
	@ParameterizedTest(name = "Owning teacher deletes {0}")
	@EnumSource(AnnotationSource.class)
	void owningTeacherCanDeleteEitherSource(AnnotationSource source) throws Exception {
		AnswerAnnotation annotation = source == AnnotationSource.AI
				? saveAiAnnotation(ReviewStatus.ACCEPTED) : createTeacherAnnotation("GRAMMAR");
		MvcResult result = call(Operation.DELETE, annotation.getId(), teacherId, UserRole.TEACHER, null);
		assertMessage(result, 200);
		flushAndClear();
		assertThat(annotationRepository.existsById(annotation.getId())).isFalse();
		assertAnnotationList(listAs(teacherId, UserRole.TEACHER), List.of());
		assertAnnotationList(listAs(studentId, UserRole.STUDENT), List.of());
	}

	/** B2/EDGE: synthetic POST payload at the VARCHAR(50) boundary, with valid offsets.
	 * Expected: length 50 -> 201; length 51 -> 400 (client validation error).
	 * Current prediction: PASS at 50; FAIL at 51, because unvalidated errorType reaches PostgreSQL -> 500.
	 */
	@ParameterizedTest(name = "errorType length {0}: expected HTTP {1}")
	@CsvSource({"50,201", "51,400"})
	void errorTypeLengthIsValidatedBeforePersistence(int length, int expectedStatus) throws Exception {
		MvcResult result = call(Operation.CREATE, answerId, teacherId, UserRole.TEACHER,
				createBody("G".repeat(length)));
		if (expectedStatus == 400) {
			assertError(result, 400);
		} else {
			assertThat(result.getResponse().getStatus()).isEqualTo(201);
			assertThat(objectMapper.readTree(result.getResponse().getContentAsString()).size()).isEqualTo(2);
			assertThat(annotationRepository.findByAnswerIdOrderByIdAsc(answerId)).singleElement()
					.satisfies(annotation -> assertThat(annotation.getErrorType()).hasSize(length));
		}
	}

	private AnswerAnnotation saveAiAnnotation(ReviewStatus status) {
		return annotationRepository.saveAndFlush(new AnswerAnnotation(answerId, AnnotationSource.AI, 0, 5,
				"GRAMMAR", "Synthetic AI comment", "Synthetic correction", status));
	}

	private AnswerAnnotation createTeacherAnnotation(String errorType) throws Exception {
		MvcResult result = call(Operation.CREATE, answerId, teacherId, UserRole.TEACHER, createBody(errorType));
		assertThat(result.getResponse().getStatus()).isEqualTo(201);
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(body.size()).isEqualTo(2);
		assertThat(body.path("message").asText()).isNotBlank();
		flushAndClear();
		AnswerAnnotation annotation = annotationRepository.findById(body.path("id").asLong()).orElseThrow();
		assertThat(annotation.getSource()).isEqualTo(AnnotationSource.TEACHER);
		assertThat(annotation.getReviewStatus()).isEqualTo(ReviewStatus.ACCEPTED);
		return annotation;
	}

	private MvcResult listAs(long userId, UserRole role) throws Exception {
		return call(Operation.LIST, answerId, userId, role, null);
	}

	private void assertAnnotationList(MvcResult result, List<AnswerAnnotation> expectedRows) throws Exception {
		assertThat(result.getResponse().getStatus()).isEqualTo(200);
		JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(root.size()).as("The list response must contain only data, without a new envelope").isEqualTo(1);
		JsonNode data = root.path("data");
		assertThat(data.isArray()).isTrue();
		List<AnswerAnnotation> sorted = expectedRows.stream().sorted(Comparator.comparing(AnswerAnnotation::getId)).toList();
		assertThat(data.size()).as("Only the expected rows may be exposed to this caller").isEqualTo(sorted.size());
		for (int i = 0; i < sorted.size(); i++) {
			AnswerAnnotation expected = sorted.get(i);
			JsonNode item = data.get(i);
			assertThat(item.size()).as("Existing eight-field annotation response shape").isEqualTo(8);
			assertAll(
					() -> assertThat(item.path("id").asLong()).isEqualTo(expected.getId()),
					() -> assertThat(item.path("source").asText()).isEqualTo(expected.getSource().name()),
					() -> assertThat(item.path("reviewStatus").asText()).isEqualTo(expected.getReviewStatus().name()),
					() -> assertThat(item.path("startOffset").asInt()).isEqualTo(expected.getStartOffset()),
					() -> assertThat(item.path("endOffset").asInt()).isEqualTo(expected.getEndOffset()),
					() -> assertThat(item.path("errorType").asText()).isEqualTo(expected.getErrorType()),
					() -> assertThat(item.path("comment").asText()).isEqualTo(expected.getComment()),
					() -> assertThat(item.path("suggestedFix").asText()).isEqualTo(expected.getSuggestedFix()));
		}
	}

	private void review(long annotationId, String status) throws Exception {
		assertMessage(call(Operation.REVIEW, annotationId, teacherId, UserRole.TEACHER,
				objectMapper.writeValueAsString(Map.of("reviewStatus", status))), 200);
		flushAndClear();
	}

	private void assertMessage(MvcResult result, int status) throws Exception {
		assertThat(result.getResponse().getStatus()).isEqualTo(status);
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(body.size()).isEqualTo(1);
		assertThat(body.path("message").asText()).isNotBlank();
	}

	private void assertError(MvcResult result, int status) throws Exception {
		assertThat(result.getResponse().getStatus()).isEqualTo(status);
		JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
		assertThat(body.size()).isEqualTo(1);
		assertThat(body.path("error").asText()).isNotBlank();
	}

	private MvcResult call(Operation operation, long id, Long userId, UserRole role, String body) throws Exception {
		var builder = request(operation.method, operation.path, id);
		if (userId != null) {
			builder.header("Authorization", "Bearer " + jwtTokenService.createAccessToken(userId,
					com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name())));
		}
		if (body != null) builder.contentType(MediaType.APPLICATION_JSON).content(body);
		return mockMvc.perform(builder).andReturn();
	}

	private String defaultBody(Operation operation) throws Exception {
		return switch (operation) {
			case CREATE -> createBody("GRAMMAR");
			case REVIEW -> "{\"reviewStatus\":\"ACCEPTED\"}";
			default -> null;
		};
	}

	private String createBody(String errorType) throws Exception {
		return objectMapper.writeValueAsString(Map.of("startOffset", 0, "endOffset", 5,
				"errorType", errorType, "comment", "Synthetic teacher comment", "suggestedFix", "Synthetic correction"));
	}

	private long createUser(UserRole role, String name) {
		return userRepository.save(new User(name, "fe48." + UUID.randomUUID() + "@test.local",
				null, "unused-test-hash", role, UserStatus.ACTIVE, false)).getId();
	}

	private void flushAndClear() {
		entityManager.flush();
		entityManager.clear();
	}

	private enum Operation {
		LIST(HttpMethod.GET, "/api/v1/answers/{id}/annotations", true),
		CREATE(HttpMethod.POST, "/api/v1/answers/{id}/annotations", true),
		REVIEW(HttpMethod.PATCH, "/api/v1/annotations/{id}/review", false),
		DELETE(HttpMethod.DELETE, "/api/v1/annotations/{id}", false);

		private final HttpMethod method;
		private final String path;
		private final boolean answerRoute;

		Operation(HttpMethod method, String path, boolean answerRoute) {
			this.method = method;
			this.path = path;
			this.answerRoute = answerRoute;
		}
	}
}
