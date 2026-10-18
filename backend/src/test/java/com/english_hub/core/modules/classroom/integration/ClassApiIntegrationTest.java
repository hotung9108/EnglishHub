package com.english_hub.core.modules.classroom.integration;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;

import jakarta.persistence.EntityManager;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
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
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
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

	private static final String FORBIDDEN = "Bạn không có quyền thực hiện thao tác này.";
	private static final String UNAUTHORIZED = "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
	private static final String CLASS_NOT_FOUND = "Không tìm thấy lớp học.";
	private static final String MEMBER_NOT_FOUND = "Không tìm thấy thành viên trong lớp.";
	private static final String CLASS_OR_STUDENT_NOT_FOUND = "Không tìm thấy lớp học hoặc học viên.";

	private final MockMvc mockMvc;
	private final UserRepository userRepository;
	private final TeacherProfileRepository teacherProfileRepository;
	private final StudentProfileRepository studentProfileRepository;
	private final JwtTokenService jwtTokenService;
	private final ClassJpaRepository classRepository;
	private final ClassMemberJpaRepository memberRepository;
	private final EntityManager entityManager;

	@Autowired
	ClassApiIntegrationTest(MockMvc mockMvc, UserRepository userRepository,
			TeacherProfileRepository teacherProfileRepository, StudentProfileRepository studentProfileRepository,
			JwtTokenService jwtTokenService, ClassJpaRepository classRepository,
			ClassMemberJpaRepository memberRepository, EntityManager entityManager) {
		this.mockMvc = mockMvc;
		this.userRepository = userRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.studentProfileRepository = studentProfileRepository;
		this.jwtTokenService = jwtTokenService;
		this.classRepository = classRepository;
		this.memberRepository = memberRepository;
		this.entityManager = entityManager;
	}

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
		String createResponse = performRequest(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content(createBody))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Tạo lớp thành công."))
				.andExpect(jsonPath("$.id").isNumber())
				.andReturn().getResponse().getContentAsString();
		long classId = extractId(createResponse);

		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "level": "Advanced", "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật lớp học thành công."));

		String addStudent1 = performRequest(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Đã thêm học viên vào lớp."))
				.andExpect(jsonPath("$.memberId").isNumber())
				.andReturn().getResponse().getContentAsString();
		String addStudent2 = performRequest(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentOtherId)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		long member1 = extractMemberId(addStudent1);
		long member2 = extractMemberId(addStudent2);

		performRequest(get("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.data[0].studentCode").value("HV0001"))
				.andExpect(jsonPath("$.pagination").doesNotExist());

		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", classId, member1)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá học viên khỏi lớp."));

		performRequest(delete("/api/v1/classes/{id}", classId)
						.header("Authorization", bearer(teacherAId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		performRequest(delete("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error").value(
						"Không thể xoá: lớp học vẫn còn dữ liệu liên quan."));

		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", classId, member2)
						.header("Authorization", admin))
				.andExpect(status().isOk());

		performRequest(delete("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Xoá lớp học thành công."));

		performRequest(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy lớp học."));
	}

	@Test
	void onlyAdminsCanCreateClasses() throws Exception {
		String teacher = bearer(teacherAId, UserRole.TEACHER);
		String student = bearer(studentMemberId, UserRole.STUDENT);

		performRequest(post("/api/v1/classes")
					.header("Authorization", teacher)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "name": "BE35-teacher-create", "startDate": "2026-09-15" }"""))
				.andExpect(status().isForbidden());

		performRequest(post("/api/v1/classes")
					.header("Authorization", student)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "name": "BE35-student-create", "startDate": "2026-09-15" }"""))
				.andExpect(status().isForbidden());
	}

	@Test
	void teacherCannotUpdateAClass() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		String teacher = bearer(teacherAId, UserRole.TEACHER);
		String name = "BE35-teacher-update-" + UUID.randomUUID();
		long classId = createClassWithName(admin, name);

		performRequest(put("/api/v1/classes/{id}", classId)
					.header("Authorization", teacher)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "name": "BE35-updated-by-teacher" }"""))
				.andExpect(status().isForbidden());

		performRequest(get("/api/v1/classes/{id}", classId)
					.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value(name));
	}

	@Test
	void studentsCanReadOnlyClassesTheyBelongTo() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		String teacherWithoutClass = bearer(teacherBId, UserRole.TEACHER);
		String memberStudent = bearer(studentMemberId, UserRole.STUDENT);
		String otherStudent = bearer(studentOtherId, UserRole.STUDENT);
		long classId = createClass(admin, "BE35-student-read");
		addStudent(classId, studentMemberId, admin);

		performRequest(get("/api/v1/classes/{id}", classId)
					.header("Authorization", memberStudent))
				.andExpect(status().isOk());
		performRequest(get("/api/v1/classes/{id}/members", classId)
					.header("Authorization", memberStudent))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)));

		performRequest(get("/api/v1/classes/{id}", classId)
					.header("Authorization", otherStudent))
				.andExpect(status().isForbidden());
		performRequest(get("/api/v1/classes/{id}/members", classId)
					.header("Authorization", otherStudent))
				.andExpect(status().isForbidden());

		performRequest(get("/api/v1/classes/{id}", classId).header("Authorization", admin))
				.andExpect(status().isOk());
		performRequest(get("/api/v1/classes/{id}/members", classId).header("Authorization", admin))
				.andExpect(status().isOk());
		assertRejected(get("/api/v1/classes/{id}", classId)
				.header("Authorization", teacherWithoutClass), 403, FORBIDDEN);
		assertRejected(get("/api/v1/classes/{id}/members", classId)
				.header("Authorization", teacherWithoutClass), 403, FORBIDDEN);
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
		performRequest(put("/api/v1/classes/{id}", teacherAClass)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk());
		performRequest(post("/api/v1/classes/{id}/members", teacherAClass)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isCreated());

		performRequest(get("/api/v1/classes").header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").isArray())
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(20))
				.andExpect(jsonPath("$.pagination.total").isNumber());

		performRequest(get("/api/v1/classes").header("Authorization", teacherA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(teacherAClass));

		performRequest(get("/api/v1/classes").header("Authorization", teacherB))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));

		performRequest(get("/api/v1/classes").header("Authorization", memberStudent))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(teacherAClass));

		performRequest(get("/api/v1/classes").header("Authorization", otherStudent))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));
	}

	@Test
	void classDetailReturnsTeacherAndMemberCount() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		long classId = createClass(admin, "IELTS 7.0 - K01");
		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk());
		performRequest(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isCreated());

		performRequest(get("/api/v1/classes/{id}", classId)
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
		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherAId)))
				.andExpect(status().isOk());

		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "teacherId": %d }""".formatted(teacherBId)))
				.andExpect(status().isOk());

		performRequest(get("/api/v1/classes").header("Authorization", teacherA))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(0)));
		performRequest(get("/api/v1/classes").header("Authorization", teacherB))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].id").value(classId));
		performRequest(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.teacher.id").value(teacherBId));
	}

	@Test
	void statusFilterAcceptsAllFourValuesAndRejectsOthers() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		long classId = createClass(admin, "Lớp trạng thái");

		for (String statusValue : new String[] {"ACTIVE", "INACTIVE", "COMPLETED", "CANCELLED"}) {
			performRequest(put("/api/v1/classes/{id}", classId)
							.header("Authorization", admin)
							.contentType(MediaType.APPLICATION_JSON)
							.content("""
									{ "status": "%s" }""".formatted(statusValue)))
					.andExpect(status().isOk());
			performRequest(get("/api/v1/classes").param("status", statusValue)
							.header("Authorization", admin))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.data[0].status").value(statusValue));
		}

		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "status": "FROZEN" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"status phải là ACTIVE, INACTIVE, COMPLETED hoặc CANCELLED."));

		performRequest(get("/api/v1/classes").param("status", "FROZEN")
						.header("Authorization", admin))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("status không hợp lệ."));
	}

	@Test
	void rejectsDuplicateNamesAfterTrimAndCaseFoldingAcrossStatuses() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		String suffix = Long.toString(System.nanoTime());
		String activeName = "BE35-Duplicate-" + suffix;
		createClassWithName(admin, activeName);
		assertDuplicateClassName(admin, "  " + activeName.toLowerCase(Locale.ROOT) + "  ");

		String cancelledName = "BE35-Cancelled-" + suffix;
		long cancelledClassId = createClassWithName(admin, cancelledName);
		performRequest(put("/api/v1/classes/{id}", cancelledClassId)
					.header("Authorization", admin)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "status": "CANCELLED" }"""))
				.andExpect(status().isOk());
		assertDuplicateClassName(admin, cancelledName.toLowerCase(Locale.ROOT));

		String completedName = "BE35-Completed-" + suffix;
		long completedClassId = createClassWithName(admin, completedName);
		performRequest(put("/api/v1/classes/{id}", completedClassId)
					.header("Authorization", admin)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "status": "COMPLETED" }"""))
				.andExpect(status().isOk());
		assertDuplicateClassName(admin, completedName.toLowerCase(Locale.ROOT));

		String vietnameseName = "Lớp Tiếng Anh " + suffix;
		createClassWithName(admin, vietnameseName);
		assertDuplicateClassName(admin, "LỚP TIẾNG ANH " + suffix);
	}

	@Test
	void rejectsInvalidCreateAndUpdateInputs() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		performRequest(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "", "startDate": "2026-09-15" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu."));

		String tooLongName = "X".repeat(151);
		assertThat(tooLongName).hasSize(151);
		performRequest(post("/api/v1/classes")
					.header("Authorization", admin)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "name": "%s", "startDate": "2026-09-15" }""".formatted(tooLongName)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Dữ liệu không hợp lệ."));

		String maxLengthPrefix = "BE35-" + UUID.randomUUID();
		String maxLengthName = maxLengthPrefix + "X".repeat(150 - maxLengthPrefix.length());
		assertThat(maxLengthName).hasSize(150);
		performRequest(post("/api/v1/classes")
					.header("Authorization", admin)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "name": "%s", "startDate": "2026-09-15" }""".formatted(maxLengthName)))
				.andExpect(status().isCreated());

		performRequest(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "Lớp sai ngày", "startDate": "2026-09-15",
								  "endDate": "2026-09-01" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Ngày kết thúc phải sau ngày bắt đầu."));

		performRequest(post("/api/v1/classes")
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "name": "Lớp không giáo viên", "startDate": "2026-09-15",
								  "teacherId": 987654321 }"""))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value(
						"Không tìm thấy giáo viên (teacherId không tồn tại)."));

		long classId = createClass(admin, "Lớp cập nhật lỗi");
		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không có dữ liệu để cập nhật."));
		performRequest(put("/api/v1/classes/{id}", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "endDate": "2026-09-01" }"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Ngày kết thúc phải sau ngày bắt đầu."));
		performRequest(put("/api/v1/classes/{id}", classId)
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
		String teacher = bearer(teacherAId, UserRole.TEACHER);
		long classId = createClass(admin, "Lớp thành viên lỗi");
		assignTeacher(classId, teacherBId);
		long absentClassId = createAbsentClassId();
		long absentMemberId = createAbsentMemberId();

		performRequest(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Thiếu mã học viên."));

		performRequest(post("/api/v1/classes/{id}/members", absentClassId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy lớp học hoặc học viên."));

		long classMemberId = addStudent(classId, studentMemberId, admin);
		performRequest(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", admin)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentMemberId)))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error").value("Học viên đã có trong lớp."));

		performRequest(post("/api/v1/classes/{id}/members", classId)
					.header("Authorization", teacher)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "studentId": %d }""".formatted(studentOtherId)))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value(FORBIDDEN));

		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", classId, classMemberId)
					.header("Authorization", teacher))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value(FORBIDDEN));

		long otherClassId = createClass(admin, "Lớp thành viên khác");
		long otherClassMemberId = addStudent(otherClassId, studentOtherId, admin);
		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", classId, otherClassMemberId)
					.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy thành viên trong lớp."));

		performRequest(get("/api/v1/classes/{id}/members", otherClassId)
					.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].studentCode").value("HV0002"));

		performRequest(get("/api/v1/classes/{id}/members", classId)
					.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].studentCode").value("HV0001"));

		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", classId, absentMemberId)
						.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy thành viên trong lớp."));

		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", absentClassId, classMemberId)
						.header("Authorization", admin))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Không tìm thấy thành viên trong lớp."));

		ClassFixture owned = createClassFixture(teacherAId);
		long addedMemberId = addStudent(owned.classId(), studentOtherId, teacher);
		performRequest(delete("/api/v1/classes/{id}/members/{memberId}", owned.classId(), addedMemberId)
				.header("Authorization", teacher))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá học viên khỏi lớp."));
		flushAndClear();
		assertThat(memberRepository.findById(addedMemberId)).isEmpty();
	}

	@Test
	void classMayExistWithoutATeacher() throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);

		long classId = createClass(admin, "Lớp không giáo viên");

		performRequest(get("/api/v1/classes/{id}", classId)
						.header("Authorization", admin))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.teacher", nullValue()))
				.andExpect(jsonPath("$.memberCount").value(0));
	}

	@ParameterizedTest(name = "owning teacher: {0}")
	@EnumSource(ClassOperation.class)
	void owningTeacherCanReadAndManageMembersThroughSecurity(ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(teacherAId);
		assertSuccessfulOperation(operation, fixture, bearer(teacherAId, UserRole.TEACHER));
	}

	@ParameterizedTest(name = "non-owning teacher must be denied: {0}")
	@EnumSource(ClassOperation.class)
	void nonOwningTeacherCannotReadOrWriteMembersThroughSecurity(ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(teacherBId);
		assertRejected(classRequest(operation, fixture, bearer(teacherAId, UserRole.TEACHER)), 403, FORBIDDEN);
	}

	@ParameterizedTest(name = "teacher must be denied on unassigned class: {0}")
	@EnumSource(ClassOperation.class)
	void teacherCannotReadOrWriteMembersOfAnUnassignedClassThroughSecurity(ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(null);
		assertRejected(classRequest(operation, fixture, bearer(teacherAId, UserRole.TEACHER)), 403, FORBIDDEN);
	}

	@ParameterizedTest(name = "teacher gets 404 on absent class: {0}")
	@EnumSource(ClassOperation.class)
	void teacherGetsClassNotFoundForEveryOperation(ClassOperation operation) throws Exception {
		ClassFixture existing = createClassFixture(teacherAId);
		ClassFixture absent = new ClassFixture(createAbsentClassId(), existing.memberId(), teacherAId);
		assertRejected(classRequest(operation, absent, bearer(teacherAId, UserRole.TEACHER)), 404, CLASS_NOT_FOUND);
	}

	@ParameterizedTest(name = "admin {0}, teacher assigned={1}")
	@MethodSource("adminOperations")
	void adminKeepsReadAndWriteAccessIncludingUnassignedClasses(
			ClassOperation operation, boolean teacherAssigned) throws Exception {
		ClassFixture fixture = createClassFixture(teacherAssigned ? teacherAId : null);
		assertSuccessfulOperation(operation, fixture, bearer(adminId, UserRole.ADMIN));
	}

	private static Stream<Arguments> adminOperations() {
		List<Arguments> cases = new ArrayList<>();
		for (ClassOperation operation : ClassOperation.values()) {
			cases.add(Arguments.of(operation, true));
			cases.add(Arguments.of(operation, false));
		}
		return cases.stream();
	}

	@ParameterizedTest(name = "admin reads absent class: {0}")
	@EnumSource(value = ClassOperation.class, names = {"DETAIL", "MEMBERS"})
	void adminKeepsClassNotFoundForReads(ClassOperation operation) throws Exception {
		ClassFixture existing = createClassFixture(null);
		ClassFixture absent = new ClassFixture(createAbsentClassId(), existing.memberId(), null);
		assertRejected(classRequest(operation, absent, bearer(adminId, UserRole.ADMIN)), 404, CLASS_NOT_FOUND);
	}

	@ParameterizedTest(name = "admin POST validation: {0}")
	@EnumSource(AdminPostCase.class)
	void adminKeepsPostValidationOrderAndMessages(AdminPostCase scenario) throws Exception {
		ClassFixture fixture = createClassFixture(null);
		long classId = fixture.classId();
		String body = studentBody(studentOtherId);
		int expectedStatus = 404;
		String expectedMessage = CLASS_OR_STUDENT_NOT_FOUND;
		switch (scenario) {
			case MISSING_STUDENT -> {
				body = "{}";
				expectedStatus = 400;
				expectedMessage = "Thiếu mã học viên.";
			}
			case ABSENT_CLASS_MISSING_STUDENT -> {
				classId = createAbsentClassId();
				body = "{}";
				expectedStatus = 400;
				expectedMessage = "Thiếu mã học viên.";
			}
			case ABSENT_CLASS -> classId = createAbsentClassId();
			case ABSENT_STUDENT -> body = studentBody(createAbsentStudentId());
			case DUPLICATE -> {
				body = studentBody(studentMemberId);
				expectedStatus = 409;
				expectedMessage = "Học viên đã có trong lớp.";
			}
		}
		assertRejected(post("/api/v1/classes/{id}/members", classId)
				.header("Authorization", bearer(adminId, UserRole.ADMIN))
				.contentType(MediaType.APPLICATION_JSON).content(body), expectedStatus, expectedMessage);
	}

	@ParameterizedTest(name = "admin DELETE absent class={0}")
	@ValueSource(booleans = {true, false})
	void adminKeepsMemberNotFoundForAbsentClassesAndCrossClassMembers(boolean absentClass) throws Exception {
		ClassFixture target = createClassFixture(null);
		ClassFixture other = createClassFixture(null);
		long classId = absentClass ? createAbsentClassId() : target.classId();
		assertRejected(delete("/api/v1/classes/{id}/members/{memberId}", classId, other.memberId())
				.header("Authorization", bearer(adminId, UserRole.ADMIN)), 404, MEMBER_NOT_FOUND);
	}

	@ParameterizedTest(name = "member student: {0}")
	@EnumSource(ClassOperation.class)
	void memberStudentKeepsReadAccessAndCannotWriteMembers(ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(teacherAId);
		String student = bearer(studentMemberId, UserRole.STUDENT);
		if (operation == ClassOperation.DETAIL || operation == ClassOperation.MEMBERS) {
			assertSuccessfulOperation(operation, fixture, student);
		} else {
			assertRejected(classRequest(operation, fixture, student), 403, FORBIDDEN);
		}
	}

	@ParameterizedTest(name = "non-member student: {0}")
	@EnumSource(ClassOperation.class)
	void nonMemberStudentCannotReadOrWriteMembers(ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(teacherAId);
		assertRejected(classRequest(operation, fixture, bearer(studentOtherId, UserRole.STUDENT)), 403, FORBIDDEN);
	}

	@ParameterizedTest(name = "student on absent class: {0}")
	@EnumSource(ClassOperation.class)
	void studentKeepsReadNotFoundAndSecurityWriteDenialOnAbsentClasses(ClassOperation operation) throws Exception {
		ClassFixture existing = createClassFixture(teacherAId);
		ClassFixture absent = new ClassFixture(createAbsentClassId(), existing.memberId(), teacherAId);
		boolean reading = operation == ClassOperation.DETAIL || operation == ClassOperation.MEMBERS;
		assertRejected(classRequest(operation, absent, bearer(studentMemberId, UserRole.STUDENT)),
				reading ? 404 : 403, reading ? CLASS_NOT_FOUND : FORBIDDEN);
	}

	@Test
	void owningTeacherCannotDeleteAnotherClassesMemberAndBothClassesRemainUnchanged() throws Exception {
		ClassFixture owned = createClassFixture(teacherAId, studentOtherId);
		ClassFixture other = createClassFixture(teacherBId, studentMemberId);
		MemberState original = memberState(other.memberId());
		assertRejected(delete("/api/v1/classes/{id}/members/{memberId}", owned.classId(), other.memberId())
				.header("Authorization", bearer(teacherAId, UserRole.TEACHER)), 404, MEMBER_NOT_FOUND);
		assertThat(memberState(other.memberId())).isEqualTo(original);
	}

	@Test
	void owningTeacherAddsOnlyTheTargetMembershipWithoutChangingTheOtherClass() throws Exception {
		ClassFixture owned = createClassFixture(teacherAId, studentOtherId);
		ClassFixture other = createClassFixture(teacherBId, studentMemberId);
		List<MemberState> targetBefore = classMembers(owned.classId());
		List<MemberState> otherBefore = classMembers(other.classId());

		String response = performRequest(post("/api/v1/classes/{id}/members", owned.classId())
				.header("Authorization", bearer(teacherAId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON).content(studentBody(studentMemberId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Đã thêm học viên vào lớp."))
				.andReturn().getResponse().getContentAsString();

		MemberState added = memberState(extractMemberId(response));
		assertThat(added.classId()).isEqualTo(owned.classId());
		assertThat(added.studentId()).isEqualTo(studentMemberId);
		assertThat(classMembers(owned.classId())).hasSize(targetBefore.size() + 1)
				.containsAll(targetBefore).contains(added);
		assertThat(classMembers(other.classId())).isEqualTo(otherBefore);
	}

	@Test
	void owningTeacherDuplicatePostLeavesBothClassesMembershipsUnchanged() throws Exception {
		ClassFixture owned = createClassFixture(teacherAId, studentMemberId);
		ClassFixture other = createClassFixture(teacherBId, studentMemberId);
		List<MemberState> targetBefore = classMembers(owned.classId());
		List<MemberState> otherBefore = classMembers(other.classId());

		assertRejected(post("/api/v1/classes/{id}/members", owned.classId())
				.header("Authorization", bearer(teacherAId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON).content(studentBody(studentMemberId)),
				409, "Học viên đã có trong lớp.");

		assertThat(classMembers(owned.classId())).isEqualTo(targetBefore);
		assertThat(classMembers(other.classId())).isEqualTo(otherBefore);
	}

	@ParameterizedTest(name = "admin JWT issued before {0}: {1}")
	@MethodSource("inactiveUserOperations")
	void inactiveAdminKeepsWritesButCannotReadClasses(UserChange change, ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(null);
		String tokenBeforeChange = bearer(adminId, UserRole.ADMIN);
		deactivateUser(adminId, change);

		if (operation == ClassOperation.DETAIL || operation == ClassOperation.MEMBERS) {
			assertRejected(classRequest(operation, fixture, tokenBeforeChange), 401, UNAUTHORIZED);
		} else {
			assertSuccessfulOperation(operation, fixture, tokenBeforeChange);
		}
	}

	@ParameterizedTest(name = "teacher JWT issued before {0}: {1}")
	@MethodSource("inactiveUserOperations")
	void inactiveTeacherCannotReadOrWriteMembers(UserChange change, ClassOperation operation) throws Exception {
		ClassFixture fixture = createClassFixture(teacherAId);
		String tokenBeforeChange = bearer(teacherAId, UserRole.TEACHER);
		deactivateUser(teacherAId, change);
		assertRejected(classRequest(operation, fixture, tokenBeforeChange), 401, UNAUTHORIZED);
	}

	private static Stream<Arguments> inactiveUserOperations() {
		List<Arguments> cases = new ArrayList<>();
		for (UserChange change : UserChange.values()) {
			for (ClassOperation operation : ClassOperation.values()) {
				cases.add(Arguments.of(change, operation));
			}
		}
		return cases.stream();
	}

	private void deactivateUser(long userId, UserChange change) {
		User current = user(userId);
		current.updateFrom(current.getFullName(), current.getEmail(), current.getPhone(), current.getAvatarUrl(),
				current.getPasswordHash(), current.getRole(),
				change == UserChange.LOCKED ? UserStatus.LOCKED : current.getStatus(),
				change == UserChange.DELETED);
		userRepository.save(current);
		flushAndClear();
		User stored = user(userId);
		assertThat(stored.getStatus()).isEqualTo(change == UserChange.LOCKED ? UserStatus.LOCKED : UserStatus.ACTIVE);
		assertThat(stored.isDeleted()).isEqualTo(change == UserChange.DELETED);
	}

	private ClassFixture createClassFixture(Long teacherId) throws Exception {
		return createClassFixture(teacherId, studentMemberId);
	}

	private ClassFixture createClassFixture(Long teacherId, long studentId) throws Exception {
		String admin = bearer(adminId, UserRole.ADMIN);
		long classId = createClass(admin, "BE50-class");
		if (teacherId != null) {
			assignTeacher(classId, teacherId);
		}
		long memberId = addStudent(classId, studentId, admin);
		flushAndClear();
		assertThat(classRepository.findById(classId).orElseThrow().getTeacherId()).isEqualTo(teacherId);
		assertThat(memberRepository.findByClassIdAndId(classId, memberId)).isPresent();
		return new ClassFixture(classId, memberId, teacherId);
	}

	private void assignTeacher(long classId, long teacherId) throws Exception {
		performRequest(put("/api/v1/classes/{id}", classId)
				.header("Authorization", bearer(adminId, UserRole.ADMIN))
				.contentType(MediaType.APPLICATION_JSON).content("{ \"teacherId\": %d }".formatted(teacherId)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật lớp học thành công."));
	}

	private long createAbsentClassId() throws Exception {
		long id = createClass(bearer(adminId, UserRole.ADMIN), "BE50-absent-class");
		classRepository.deleteById(id);
		flushAndClear();
		assertThat(classRepository.existsById(id)).isFalse();
		return id;
	}

	private long createAbsentMemberId() throws Exception {
		ClassFixture fixture = createClassFixture(null);
		memberRepository.deleteById(fixture.memberId());
		flushAndClear();
		assertThat(memberRepository.existsById(fixture.memberId())).isFalse();
		return fixture.memberId();
	}

	private long createAbsentStudentId() {
		long id = user(UserRole.STUDENT, null, null);
		userRepository.deleteById(id);
		flushAndClear();
		assertThat(userRepository.existsById(id)).isFalse();
		return id;
	}

	private MockHttpServletRequestBuilder classRequest(ClassOperation operation, ClassFixture fixture, String bearer) {
		MockHttpServletRequestBuilder request = switch (operation) {
			case DETAIL -> get("/api/v1/classes/{id}", fixture.classId());
			case MEMBERS -> get("/api/v1/classes/{id}/members", fixture.classId());
			case ADD_MEMBER -> post("/api/v1/classes/{id}/members", fixture.classId())
					.contentType(MediaType.APPLICATION_JSON).content(studentBody(studentOtherId));
			case REMOVE_MEMBER -> delete("/api/v1/classes/{id}/members/{memberId}", fixture.classId(), fixture.memberId());
		};
		return request.header("Authorization", bearer);
	}

	private void assertSuccessfulOperation(ClassOperation operation, ClassFixture fixture, String bearer) throws Exception {
		ResultActions result = performRequest(classRequest(operation, fixture, bearer));
		switch (operation) {
			case DETAIL -> {
				result.andExpect(status().isOk()).andExpect(jsonPath("$.id").value(fixture.classId()))
						.andExpect(jsonPath("$.memberCount").value(1));
				if (fixture.teacherId() == null) {
					result.andExpect(jsonPath("$.teacher", nullValue()));
				} else {
					result.andExpect(jsonPath("$.teacher.id").value(fixture.teacherId()));
				}
			}
			case MEMBERS -> result.andExpect(status().isOk())
					.andExpect(jsonPath("$.data", hasSize(1)))
					.andExpect(jsonPath("$.data[0].memberId").value(fixture.memberId()))
					.andExpect(jsonPath("$.data[0].studentId").value(studentMemberId));
			case ADD_MEMBER -> {
				String response = result.andExpect(status().isCreated())
						.andExpect(jsonPath("$.message").value("Đã thêm học viên vào lớp."))
						.andReturn().getResponse().getContentAsString();
				MemberState member = memberState(extractMemberId(response));
				assertThat(member.classId()).isEqualTo(fixture.classId());
				assertThat(member.studentId()).isEqualTo(studentOtherId);
			}
			case REMOVE_MEMBER -> {
				result.andExpect(status().isOk())
						.andExpect(jsonPath("$.message").value("Đã xoá học viên khỏi lớp."));
				flushAndClear();
				assertThat(memberRepository.findById(fixture.memberId())).isEmpty();
			}
		}
	}

	private void assertRejected(MockHttpServletRequestBuilder request, int expectedStatus, String expectedMessage)
			throws Exception {
		performRequest(request).andExpect(status().is(expectedStatus))
				.andExpect(jsonPath("$.error").value(expectedMessage));
	}

	private ResultActions performRequest(MockHttpServletRequestBuilder request) throws Exception {
		DatabaseState before = databaseState();
		ResultActions result = mockMvc.perform(request);
		int responseStatus = result.andReturn().getResponse().getStatus();
		if (responseStatus == 400 || responseStatus == 401 || responseStatus == 403
				|| responseStatus == 404 || responseStatus == 409) {
			assertThat(databaseState()).as("Class and membership rows must not change after HTTP %s", responseStatus)
					.isEqualTo(before);
		}
		return result;
	}

	private DatabaseState databaseState() {
		flushAndClear();
		List<ClassState> classes = classRepository.findAll(Sort.by("id")).stream()
				.map(row -> new ClassState(row.getId(), row.getName(), row.getLevel(), row.getDescription(),
						row.getStartDate(), row.getEndDate(), row.getStatus().name(), row.getTeacherId(),
						row.getCreatedAt(), row.getUpdatedAt()))
				.toList();
		List<MemberState> members = memberRepository.findAll(Sort.by("id")).stream().map(MemberState::from).toList();
		return new DatabaseState(classes, members);
	}

	private List<MemberState> classMembers(long classId) {
		flushAndClear();
		return memberRepository.findByClassId(classId).stream().map(MemberState::from)
				.sorted(java.util.Comparator.comparing(MemberState::id)).toList();
	}

	private MemberState memberState(long memberId) {
		flushAndClear();
		return MemberState.from(memberRepository.findById(memberId).orElseThrow());
	}

	private void flushAndClear() {
		entityManager.flush();
		entityManager.clear();
	}

	private String studentBody(long studentId) {
		return "{ \"studentId\": %d }".formatted(studentId);
	}

	private enum ClassOperation { DETAIL, MEMBERS, ADD_MEMBER, REMOVE_MEMBER }

	private enum AdminPostCase { MISSING_STUDENT, ABSENT_CLASS_MISSING_STUDENT, ABSENT_CLASS, ABSENT_STUDENT, DUPLICATE }

	private enum UserChange { LOCKED, DELETED }

	private record ClassFixture(long classId, long memberId, Long teacherId) { }

	private record ClassState(long id, String name, String level, String description, LocalDate startDate,
			LocalDate endDate, String status, Long teacherId, Instant createdAt, Instant updatedAt) { }

	private record MemberState(long id, long classId, long studentId, Instant createdAt) {
		private static MemberState from(ClassMemberEntity member) {
			return new MemberState(member.getId(), member.getClassId(), member.getStudentId(), member.getCreatedAt());
		}
	}

	private record DatabaseState(List<ClassState> classes, List<MemberState> members) { }

	private long createClass(String bearer, String name) throws Exception {
		return createClassWithName(bearer, unique(name));
	}

	private long createClassWithName(String bearer, String name) throws Exception {
		String response = performRequest(post("/api/v1/classes")
						.header("Authorization", bearer)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
							{ "name": "%s", "startDate": "2026-09-15" }""".formatted(name)))
				.andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString();
		return extractId(response);
	}

	private void assertDuplicateClassName(String admin, String duplicateName) throws Exception {
		performRequest(post("/api/v1/classes")
					.header("Authorization", admin)
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{ "name": "%s", "startDate": "2026-09-15" }""".formatted(duplicateName)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Tên lớp đã tồn tại."));
	}

	private long addStudent(long classId, long studentId, String bearer) throws Exception {
		String response = performRequest(post("/api/v1/classes/{id}/members", classId)
						.header("Authorization", bearer)
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{ "studentId": %d }""".formatted(studentId)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Đã thêm học viên vào lớp."))
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
