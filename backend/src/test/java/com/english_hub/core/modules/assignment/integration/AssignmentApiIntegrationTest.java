package com.english_hub.core.modules.assignment.integration;

import static org.hamcrest.Matchers.hasSize;
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
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
	void listIsVisibleToOwnerAndMemberButNotOtherRoles() throws Exception {
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(assignmentId));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)));

		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/classes/{id}/assignments", classId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
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
				.andExpect(status().isOk());
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
