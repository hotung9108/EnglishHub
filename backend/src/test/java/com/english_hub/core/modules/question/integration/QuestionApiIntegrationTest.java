package com.english_hub.core.modules.question.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.Answer;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.infrastructure.persistence.entity.QuestionType;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QuestionApiIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("englishhub_question_test")
			.withUsername("test")
			.withPassword("test");

	@org.springframework.test.context.DynamicPropertySource
	static void registerPostgresProperties(
			org.springframework.test.context.DynamicPropertyRegistry registry) {
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
	private AnswerRepository answerRepository;

	@Autowired
	private JwtTokenService jwtTokenService;

	private Long teacherId;
	private Long otherTeacherId;
	private Long studentId;
	private Long otherStudentId;
	private Long assignmentId;
	private Long moduleId;
	private Long questionId;

	@BeforeEach
	void setUp() {
		teacherId = createUser(UserRole.TEACHER, "Question teacher");
		otherTeacherId = createUser(UserRole.TEACHER, "Other question teacher");
		studentId = createUser(UserRole.STUDENT, "Question student");
		otherStudentId = createUser(UserRole.STUDENT, "Other question student");

		teacherProfileRepository.save(new TeacherProfile(findUser(teacherId), "IELTS"));
		teacherProfileRepository.save(new TeacherProfile(findUser(otherTeacherId), "IELTS"));
		studentProfileRepository.save(new StudentProfile(
				findUser(studentId), "Q-STUDENT-" + uniqueSuffix(), LocalDate.of(2004, 4, 1), null));
		studentProfileRepository.save(new StudentProfile(
				findUser(otherStudentId), "Q-STUDENT-" + uniqueSuffix(), LocalDate.of(2005, 5, 2), null));

		ClassEntity englishClass = classRepository.save(new ClassEntity(
				"Question class " + uniqueSuffix(),
				"Intermediate",
				"Question API test class",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId));
		classMemberRepository.save(new ClassMemberEntity(englishClass.getId(), studentId));

		Assignment assignment = assignmentRepository.save(new Assignment(
				englishClass.getId(),
				"Question assignment",
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

		Question question = questionRepository.save(new Question(
				moduleId,
				"Choose the correct option",
				QuestionType.MULTIPLE_CHOICE,
				"""
						{"options":[
						  {"id":1,"content":"A","is_correct":true},
						  {"id":2,"content":"B","is_correct":false},
						  {"id":3,"content":"C","is_correct":false},
						  {"id":4,"content":"D","is_correct":false}
						]}
						""",
				BigDecimal.ONE,
				1));
		questionId = question.getId();
	}

	@Test
	void ownerGetsCamelCaseAnswerAndStudentDoesNotGetAnswer() throws Exception {
		mockMvc.perform(get("/api/v1/modules/{id}/questions", moduleId)
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data", hasSize(1)))
				.andExpect(jsonPath("$.data[0].correctAnswer.options[0].isCorrect").value(true));

		mockMvc.perform(get("/api/v1/modules/{id}/questions", moduleId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[0].correctAnswer").doesNotExist());

		mockMvc.perform(get("/api/v1/questions/{id}", questionId)
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.correctAnswer").doesNotExist());
	}

	@Test
	void otherTeacherCannotReadOrWriteQuestion() throws Exception {
		mockMvc.perform(get("/api/v1/questions/{id}", questionId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER)))
				.andExpect(status().isForbidden());

		mockMvc.perform(put("/api/v1/questions/{id}", questionId)
					.header("Authorization", bearer(otherTeacherId, UserRole.TEACHER))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"content\":\"Blocked\"}"))
				.andExpect(status().isForbidden());
 	}

	@Test
	void createUpdateAndDeleteQuestionUseCamelCaseApi() throws Exception {
		String createBody = "{\"content\":\"New question\",\"questionType\":\"SHORT_ANSWER\","
				+ "\"correctAnswer\":{\"correctAnswer\":\"English\"},\"orderIndex\":2}";
		String createdId = mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content(createBody))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Tạo câu hỏi thành công."))
				.andReturn()
				.getResponse()
				.getContentAsString()
				.replaceAll("[^0-9]", "");

		long createdQuestionId = Long.parseLong(createdId);
		mockMvc.perform(put("/api/v1/questions/{id}", createdQuestionId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"content\":\"Updated\",\"score\":2,\"orderIndex\":2}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật câu hỏi thành công."));

		questionRepository.flush();
		Question updated = questionRepository.findById(createdQuestionId).orElseThrow();
		assertThat(updated.getQuestionType()).isEqualTo(QuestionType.SHORT_ANSWER);
		assertThat(updated.getContent()).isEqualTo("Updated");
		assertThat(updated.getCorrectAnswer()).contains("correct_answer");

		mockMvc.perform(delete("/api/v1/questions/{id}", createdQuestionId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá câu hỏi."));
	}

	@Test
	void deleteRejectsQuestionReferencedByAnswer() throws Exception {
		Submission submission = submissionRepository.save(new Submission(
				assignmentId,
				studentId,
				1,
				null,
				SubmissionStatus.IN_PROGRESS));
		SubmissionModule submissionModule = submissionModuleRepository.save(new SubmissionModule(
				submission.getId(), moduleId, SubmissionStatus.IN_PROGRESS));
		answerRepository.save(new Answer(
				submissionModule.getId(),
				questionId,
				"{\"selected_option_ids\":[1]}",
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				null));

		mockMvc.perform(delete("/api/v1/questions/{id}", questionId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Không thể xoá câu hỏi đã có câu trả lời."));
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
