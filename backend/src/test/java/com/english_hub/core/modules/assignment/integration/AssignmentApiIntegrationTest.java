package com.english_hub.core.modules.assignment.integration;

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
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AssignmentApiIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private ClassJpaRepository classRepository;

	@Autowired
	private ClassMemberJpaRepository classMemberRepository;

	@Autowired
	private AssignmentRepository assignmentRepository;

	@Autowired
	private JwtTokenService jwtTokenService;

	@PersistenceContext
	private EntityManager entityManager;

	private Long adminId;
	private Long teacherId;
	private Long otherTeacherId;
	private Long studentId;
	private Long otherStudentId;
	private Long classId;
	private Long assignmentId;

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

	@Test
	void getAndUpdateResponsesIncludeMaxSubmissions() throws Exception {
		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxSubmissions").value(2));

		mockMvc.perform(put("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"maxSubmissions\":3}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("Cập nhật bài tập thành công."))
			.andExpect(jsonPath("$.maxSubmissions").value(3));

		entityManager.flush();
		entityManager.clear();

		mockMvc.perform(get("/api/v1/assignments/{id}", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.maxSubmissions").value(3));
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
}
