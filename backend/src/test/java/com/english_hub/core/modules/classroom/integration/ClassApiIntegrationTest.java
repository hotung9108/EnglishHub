package com.english_hub.core.modules.classroom.integration;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClassApiIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private TeacherProfileRepository teacherProfileRepository;

	@Autowired
	private StudentProfileRepository studentProfileRepository;

	@Autowired
	private JwtTokenService jwtTokenService;

	private Long adminId;
	private Long teacherAId;
	private Long teacherBId;
	private Long studentMemberId;
	private Long studentOtherId;

	@BeforeEach
	void setUp() {
		adminId = user(UserRole.ADMIN, null, null);
		teacherAId = user(UserRole.TEACHER, "Trần Văn A", null);
		teacherBId = user(UserRole.TEACHER, "Trần Văn B", null);
		studentMemberId = user(UserRole.STUDENT, "Trần Tiến Sơn", "HV0001");
		studentOtherId = user(UserRole.STUDENT, "Lê Văn Hùng", "HV0002");

		teacherProfileRepository.save(new TeacherProfile(user(teacherAId), "IELTS"));
		teacherProfileRepository.save(new TeacherProfile(user(teacherBId), "IELTS"));
		studentProfileRepository.save(new StudentProfile(user(studentMemberId), "HV0001",
				LocalDate.of(2004, 4, 1), "0912345678"));
		studentProfileRepository.save(new StudentProfile(user(studentOtherId), "HV0002",
				LocalDate.of(2005, 5, 2), "0912345679"));
	}

	@Test
	void classLifecycleFlow() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		String createBody = """
				{ "name": "IELTS 6.5 - K12", "level": "Intermediate",
				  "description": "Luyện IELTS",
				  "startDate": "2026-09-15", "endDate": "2027-01-31" }""";
		String createResponse = mockMvc.perform(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content(createBody))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Tạo lớp thành công."))
				.andExpect(jsonPath("$.id").isNumber())
				.andReturn().getResponse().getContentAsString();
		long classId = extractId(createResponse);

		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "level": "Advanced", "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật lớp học thành công."));

		String addStudent1 = mockMvc.perform(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Đã thêm học viên vào lớp."))
				.andExpect(jsonPath("$.memberId").isNumber())
				.andReturn().getResponse().getContentAsString();
		String addStudent2 = mockMvc.perform(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentOtherId)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		long member1 = extractMemberId(addStudent1);
		long member2 = extractMemberId(addStudent2);

		mockMvc.perform(get("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.data[0].studentCode").value("HV0001"))
				.andExpect(jsonPath("$.pagination").doesNotExist());

		mockMvc.perform(delete("/api/v1/classes/{id}/members/{memberId}", classId, member1)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá học viên khỏi lớp."));

		mockMvc.perform(delete("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error").value(
						"Không thể xoá: lớp học vẫn còn dữ liệu liên quan."));

		mockMvc.perform(delete("/api/v1/classes/{id}/members/{memberId}", classId, member2)
						.header("Authorization", admin))
				.andExpect(status().isOk());

		mockMvc.perform(delete("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Xoá lớp học thành công."));

		mockMvc.perform(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy lớp học."));
	}

	@Test
	void classListIsScopedByCallerRole() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		String teacherA = bearer(teacherAId, UserRole.TEACHER);
		String teacherB = bearer(teacherBId, UserRole.TEACHER);
		String memberStudent = bearer(studentMemberId, UserRole.STUDENT);
		String otherStudent = bearer(studentOtherId, UserRole.STUDENT);

		long teacherAClass = createClass(admin, "Lớp của thầy A");
		createClass(admin, "Lớp không người dạy");
		mockMvc.perform(put("/api/v1/classes/{id}", teacherAClass)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/v1/classes/{id}/members", teacherAClass)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/v1/classes").header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").isArray())
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(20))
				.andExpect(jsonPath("$.pagination.total").isNumber());

		mockMvc.perform(get("/api/v1/classes").header("Authorization", teacherA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(teacherAClass));

		mockMvc.perform(get("/api/v1/classes").header("Authorization", teacherB))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));

		mockMvc.perform(get("/api/v1/classes").header("Authorization", memberStudent))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(teacherAClass));

		mockMvc.perform(get("/api/v1/classes").header("Authorization", otherStudent))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));
	}

	@Test
	void classDetailReturnsTeacherAndMemberCount() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		long classId = createClass(admin, "IELTS 7.0 - K01");
		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk());
		mockMvc.perform(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isCreated());

		mockMvc.perform(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value(containsString("IELTS 7.0 - K01")))
				.andExpect(jsonPath("$.status").value("ACTIVE"))
				.andExpect(jsonPath("$.teacher.id").value(teacherAId))
				.andExpect(jsonPath("$.teacher.fullName").value("Trần Văn A"))
				.andExpect(jsonPath("$.memberCount").value(1))
				.andExpect(jsonPath("$.startDate").value("2026-09-15"));
	}

	@Test
	void teacherChangeIsReflectedImmediately() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		String teacherA = bearer(teacherAId, UserRole.TEACHER);
		String teacherB = bearer(teacherBId, UserRole.TEACHER);

		long classId = createClass(admin, "Lớp chuyển giáo viên");
		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk());

		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherBId)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/classes").header("Authorization", teacherA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));
		mockMvc.perform(get("/api/v1/classes").header("Authorization", teacherB))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(classId));
		mockMvc.perform(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.teacher.id").value(teacherBId));
	}

	@Test
	void statusFilterAcceptsAllFourValuesAndRejectsOthers() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		long classId = createClass(admin, "Lớp trạng thái");

		for (String statusValue : new String[] {"ACTIVE", "INACTIVE", "COMPLETED", "CANCELLED"}) {
			mockMvc.perform(put("/api/v1/classes/{id}", classId)
							.header("Authorization", admin)
							.contentType(MediaType.APPLICATION_JSON)
							.content("""
									{ "status": "%s" }""".formatted(statusValue)))
					.andExpect(status().isOk());
			mockMvc.perform(get("/api/v1/classes").param("status", statusValue)
							.header("Authorization", admin))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.data[0].status").value(statusValue));
		}

		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "status": "FROZEN" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"status phải là ACTIVE, INACTIVE, COMPLETED hoặc CANCELLED."));

		mockMvc.perform(get("/api/v1/classes").param("status", "FROZEN")
						.header("Authorization", admin))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("status không hợp lệ."));
	}

	@Test
	void rejectsInvalidCreateAndUpdateInputs() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		mockMvc.perform(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "", "startDate": "2026-09-15" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu."));

		mockMvc.perform(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "X".repeat(151), "startDate": "2026-09-15" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Dữ liệu không hợp lệ."));

		mockMvc.perform(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "Lớp sai ngày", "startDate": "2026-09-15",
								  "endDate": "2026-09-01" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Ngày kết thúc phải sau ngày bắt đầu."));

		mockMvc.perform(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "Lớp không giáo viên", "startDate": "2026-09-15",
								  "teacherId": 987654321 }"""))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value(
						"Không tìm thấy giáo viên (teacherId không tồn tại)."));

		long classId = createClass(admin, "Lớp cập nhật lỗi");
		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không có dữ liệu để cập nhật."));
		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "endDate": "2026-09-01" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Ngày kết thúc phải sau ngày bắt đầu."));
		mockMvc.perform(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": 987654321 }"""))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value(
						"Không tìm thấy giáo viên (teacherId không tồn tại)."));
	}

	@Test
	void rejectsInvalidMembershipRequests() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		long classId = createClass(admin, "Lớp thành viên lỗi");

		mockMvc.perform(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Thiếu mã học viên."));

		mockMvc.perform(post("/api/v1/classes/{id}/members", 999999)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy lớp học hoặc học viên."));

		long classMemberId = addStudent(classId, studentMemberId, admin);
		mockMvc.perform(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error").value("Học viên đã có trong lớp."));

		mockMvc.perform(delete("/api/v1/classes/{id}/members/{memberId}", classId, 999999)
						.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy thành viên trong lớp."));

		mockMvc.perform(delete("/api/v1/classes/{id}/members/{memberId}", 999999, classMemberId)
						.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy thành viên trong lớp."));
	}

	@Test
	void classMayExistWithoutATeacher() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		long classId = createClass(admin, "Lớp không giáo viên");

		mockMvc.perform(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.teacher", nullValue()))
				.andExpect(jsonPath("$.memberCount").value(0));
	}

	private long createClass(String bearer, String name) throws Exception {
		String response = mockMvc.perform(post("/api/v1/classes")
						.header("Authorization", bearer)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "%s", "startDate": "2026-09-15" }""".formatted(unique(name))))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return extractId(response);
	}

	private long addStudent(long classId, long studentId, String bearer) throws Exception {
		String response = mockMvc.perform(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", bearer)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentId)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return extractMemberId(response);
	}

	private String unique(String name) {
		return name + "-" + UUID.randomUUID().toString().substring(0, 8);
	}

	private long extractId(String json) {
		return extractIdField(json, "\"id\"");
	}

	private long extractMemberId(String json) {
		return extractIdField(json, "\"memberId\"");
	}

	private long extractIdField(String json, String field) {
		int index = json.indexOf(field) + field.length();
		while (json.charAt(index) != ':') {
			index++;
		}
		index++;
		while (Character.isWhitespace(json.charAt(index))) {
			index++;
		}
		int end = index;
		while (Character.isDigit(json.charAt(end))) {
			end++;
		}
		return Long.parseLong(json.substring(index, end));
	}

	private String bearer(long userId, UserRole role) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
		return "Bearer " + jwtTokenService.createAccessToken(userId, tokenRole);
	}

	private long user(UserRole role, String fullName, String studentCode) {
		String suffix = UUID.randomUUID().toString().substring(0, 8);
		User user = new User(
				fullName == null ? "Người dùng " + role + "-" + suffix : fullName,
				role.name().toLowerCase() + "-" + suffix + "@englishhub.test",
				"0912345678",
				"hash",
				role,
				UserStatus.ACTIVE,
				false);
		return userRepository.save(user).getId();
	}

	private User user(Long userId) {
		return userRepository.findById(userId).orElseThrow();
	}
}