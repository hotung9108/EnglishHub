package com.english_hub.core.modules.report.integration;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.Grading;
import com.english_hub.core.infrastructure.persistence.entity.GradingMethod;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository;
import com.english_hub.core.infrastructure.persistence.repository.UserRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;

abstract class ReportIntegrationTestBase {
	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_report_test")
			.withUsername("test")
			.withPassword("test");

	@DynamicPropertySource
	static void registerPostgresProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired protected org.springframework.test.web.servlet.MockMvc mockMvc;
	@Autowired protected JwtTokenService jwtTokenService;
	@Autowired private UserRepository userRepository;
	@Autowired private TeacherProfileRepository teacherProfiles;
	@Autowired private StudentProfileRepository studentProfiles;
	@Autowired protected ClassJpaRepository classRepository;
	@Autowired protected ClassMemberJpaRepository memberRepository;
	@Autowired protected AssignmentRepository assignmentRepository;
	@Autowired protected AssignmentModuleRepository moduleRepository;
	@Autowired protected SubmissionRepository submissionRepository;
	@Autowired protected SubmissionModuleRepository submissionModuleRepository;
	@Autowired protected GradingRepository gradingRepository;

	protected long createTeacher(String name) {
		long id = createUser(UserRole.TEACHER, UserStatus.ACTIVE, false, name);
		teacherProfiles.save(new TeacherProfile(userRepository.findById(id).orElseThrow(), "IELTS"));
		return id;
	}

	protected long createStudent(String name, UserStatus status, boolean deleted) {
		long id = createUser(UserRole.STUDENT, status, deleted, name);
		studentProfiles.save(new StudentProfile(
				userRepository.findById(id).orElseThrow(), UUID.randomUUID().toString().substring(0, 8),
				LocalDate.of(2005, 1, 1), null));
		return id;
	}

	protected long createAdmin() {
		return createUser(UserRole.ADMIN, UserStatus.ACTIVE, false, "Report admin");
	}

	private long createUser(UserRole role, UserStatus status, boolean deleted, String name) {
		String suffix = UUID.randomUUID().toString();
		User user = new User(name, role.name().toLowerCase() + suffix + "@report.test",
				"0912345678", "hash", role, status, deleted);
		return userRepository.save(user).getId();
	}

	protected long createClass(Long teacherId, ClassStatus status) {
		ClassEntity englishClass = new ClassEntity("Report " + unique("class"), "Intermediate", null,
				LocalDate.of(2026, 1, 1), null, status, teacherId);
		return classRepository.save(englishClass).getId();
	}

	protected void addMember(long classId, long studentId) {
		memberRepository.save(new ClassMemberEntity(classId, studentId));
	}

	protected long createAssignment(long classId, AssignmentStatus status, String openAt, boolean deleted) {
		Assignment assignment = new Assignment(classId, unique("Assignment"), "Report fixture",
				OffsetDateTime.parse(openAt), OffsetDateTime.parse("2026-12-31T23:59:00Z"),
				3, deleted, status);
		return assignmentRepository.save(assignment).getId();
	}

	protected List<Long> createModules(long assignmentId, BigDecimal... maximums) {
		java.util.ArrayList<Long> ids = new java.util.ArrayList<>();
		for (int index = 0; index < maximums.length; index++) {
			AssignmentModule module = new AssignmentModule(assignmentId, ModuleSkill.values()[index % 4],
					ModuleTaskType.QUIZ, index + 1, "Report module", maximums[index],
					null, null, null, null, null);
			ids.add(moduleRepository.save(module).getId());
		}
		return ids;
	}

	protected long addAttempt(
			long assignmentId,
			long studentId,
			int number,
			SubmissionStatus submissionStatus,
			OffsetDateTime submittedAt,
			BigDecimal[] scores,
			GradingStatus[] gradingStatuses,
			BigDecimal[] snapshots) {
		Submission submission = submissionRepository.save(new Submission(
				assignmentId, studentId, number, submittedAt, submissionStatus));
		List<AssignmentModule> modules = moduleRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId);
		for (int index = 0; index < modules.size(); index++) {
			SubmissionModule submissionModule = submissionModuleRepository.save(new SubmissionModule(
					submission.getId(), modules.get(index).getId(), submissionStatus));
			gradingRepository.save(new Grading(submissionModule.getId(), GradingMethod.AUTO,
					gradingStatuses[index], null, scores[index], null, snapshots[index],
					null, null, null, null, null));
		}
		return submission.getId();
	}

	protected String bearer(long userId, UserRole role) {
		com.english_hub.core.modules.user.domain.model.UserRole tokenRole =
				com.english_hub.core.modules.user.domain.model.UserRole.valueOf(role.name());
		return "Bearer " + jwtTokenService.createAccessToken(userId, tokenRole);
	}

	protected String unique(String prefix) {
		return prefix + "-" + UUID.randomUUID();
	}
}
