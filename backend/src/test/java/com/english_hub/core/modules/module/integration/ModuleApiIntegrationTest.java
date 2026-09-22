package com.english_hub.core.modules.module.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.infrastructure.persistence.repository.QuestionRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.infrastructure.security.JwtTokenService;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
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
import java.math.BigDecimal;
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
import org.springframework.mock.web.MockMultipartFile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ModuleApiIntegrationTest {

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
	private AssignmentModuleRepository moduleRepository;

	@Autowired
	private QuestionRepository questionRepository;

	@Autowired
	private SubmissionRepository submissionRepository;

	@Autowired
	private SubmissionModuleRepository submissionModuleRepository;

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
	private Long readingModuleId;
	private Long listeningModuleId;

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
				findUser(studentId), "HV-" + uniqueSuffix(), LocalDate.of(2004, 4, 1), "0912345678"));
		studentProfileRepository.save(new StudentProfile(
				findUser(otherStudentId), "HV-" + uniqueSuffix(), LocalDate.of(2005, 5, 2), "0912345679"));

		ClassEntity englishClass = classRepository.save(new ClassEntity(
				"Module API class " + uniqueSuffix(),
				"Intermediate",
				"Module API test class",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId));
		classId = englishClass.getId();
		classMemberRepository.save(new ClassMemberEntity(classId, studentId));

		Assignment assignment = assignmentRepository.save(new Assignment(
				classId,
				"Module API assignment",
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));
		assignmentId = assignment.getId();

		AssignmentModule reading = moduleRepository.save(new AssignmentModule(
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
		readingModuleId = reading.getId();
		AssignmentModule listening = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.LISTENING,
				ModuleTaskType.QUIZ,
				2,
				"Listen",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
			null));
		listeningModuleId = listening.getId();
	}

	@Test
	void listAllowsOwnerAndMemberButBlocksOtherTeacherAndAdmin() throws Exception {
		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(2)))
				.andExpect(jsonPath("$.data[0].orderIndex").value(1))
				.andExpect(jsonPath("$.data[1].orderIndex").value(2));

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
	}

	@Test
	void createAllowsOwnerAndBlocksStudentOtherTeacherAndAdmin() throws Exception {
		String body = "{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\","
				+ "\"orderIndex\":3,\"instructions\":\"Write\",\"maxScore\":20}";

		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Thêm module thành công."))
				.andExpect(jsonPath("$.id").isNumber());

		for (UserRole role : new UserRole[] {UserRole.STUDENT, UserRole.ADMIN}) {
			mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
						.header("Authorization", bearer(role == UserRole.STUDENT ? studentId : adminId, role))
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":4}"))
					.andExpect(status().isForbidden());
		}

		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":5}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void duplicateOrderIndexIsRejectedAndSelfUpdateIsAllowed() throws Exception {
		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"skill\":\"WRITING\",\"taskType\":\"ESSAY\",\"orderIndex\":3}"))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/assignments/{id}/modules", assignmentId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"skill\":\"SPEAKING\",\"taskType\":\"RECORDING\",\"orderIndex\":3}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("orderIndex đã được sử dụng trong bài tập này."));

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"orderIndex\":1}"))
				.andExpect(status().isOk());
	}

	@Test
	void detailAllowsMemberAndBlocksOtherStudentAndAdmin() throws Exception {
		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.skill").value("READING"))
				.andExpect(jsonPath("$.aiInstruction").value("Grade reading"));

		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk());

		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
	}

	@Test
	void updateAndDeleteRequireOwningTeacher() throws Exception {
		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Updated\",\"maxScore\":20,\"orderIndex\":1}"))
				.andExpect(status().isOk());

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Blocked\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Blocked\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"instructions\":\"Blocked\"}"))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());
	}

	@Test
	void deleteCascadesQuestionsButRejectsModuleReferencedBySubmission() throws Exception {
		Question question = questionRepository.save(new Question(
				readingModuleId,
				"Choose one",
				QuestionType.SHORT_ANSWER,
				"{\"correct_answer\":\"English\"}",
				BigDecimal.ONE,
				1));

		mockMvc.perform(delete("/api/v1/modules/{id}", readingModuleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá module."));

		entityManager.flush();
		entityManager.clear();
		assertThat(moduleRepository.findById(readingModuleId)).isEmpty();
		assertThat(questionRepository.findById(question.getId())).isEmpty();

		AssignmentModule referencedModule = moduleRepository.save(new AssignmentModule(
				assignmentId,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				3,
				"Referenced",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null));
		Submission submission = submissionRepository.save(new Submission(
				assignmentId,
				studentId,
				1,
				null,
				SubmissionStatus.IN_PROGRESS));
		submissionModuleRepository.save(new SubmissionModule(
				submission.getId(), referencedModule.getId(), SubmissionStatus.IN_PROGRESS));

		mockMvc.perform(delete("/api/v1/modules/{id}", referencedModule.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể xoá module đã có bài nộp."));
	}

	@Test
	void listeningAudioUploadReturnsProcessingAndNonListeningIsRejected() throws Exception {
		MockMultipartFile audio = new MockMultipartFile(
				"file", "source.mp3", "audio/mpeg", new byte[] {'I', 'D', '3', 1, 2, 3});

		mockMvc.perform(multipart("/api/v1/modules/{id}/audio", listeningModuleId)
					.file(audio)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Upload audio thành công."))
				.andExpect(jsonPath("$.sourceAudioStorageKey").value(startsWith("modules/")))
				.andExpect(jsonPath("$.sourceAudioUploadStatus").value("PROCESSING"));

		mockMvc.perform(multipart("/api/v1/modules/{id}/audio", listeningModuleId)
					.file(audio)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		mockMvc.perform(multipart("/api/v1/modules/{id}/audio", listeningModuleId)
					.file(audio)
					.header("Authorization", bearer(adminId, UserRole.ADMIN)))
				.andExpect(status().isForbidden());

		mockMvc.perform(multipart("/api/v1/modules/{id}/audio", listeningModuleId)
					.file(audio)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());

		mockMvc.perform(multipart("/api/v1/modules/{id}/audio", readingModuleId)
					.file(audio)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Module này không hỗ trợ upload audio."));
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

	private String uniqueSuffix() {
		return UUID.randomUUID().toString().substring(0, 8);
	}
}
