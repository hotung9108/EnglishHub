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
import com.english_hub.core.modules.question.presentation.rest.dto.CreateQuestionRequest;
import com.english_hub.core.modules.question.presentation.rest.dto.UpdateQuestionRequest;
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.MultipleChoiceCorrectAnswer;
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.MultipleChoiceCorrectAnswer.QuestionOption;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc(print = MockMvcPrint.NONE)
@Transactional
class QuestionApiIntegrationTest {

	private static final String NULL_OPTION_MESSAGE = "options không được chứa phần tử null.";

	private final ObjectMapper objectMapper;
	private final EntityManager entityManager;

	@Autowired
	QuestionApiIntegrationTest(ObjectMapper objectMapper, EntityManager entityManager) {
		this.objectMapper = objectMapper;
		this.entityManager = entityManager;
	}

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
	void teacherAndStudentFromOneClassCannotReadQuestionsFromAnotherClass() throws Exception {
		ClassEntity foreignClass = classRepository.save(new ClassEntity(
				"Foreign question class " + uniqueSuffix(),
				"Advanced",
				"Question resource-scope fixture",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				otherTeacherId));
		Assignment foreignAssignment = assignmentRepository.save(new Assignment(
				foreignClass.getId(),
				"Foreign question assignment " + uniqueSuffix(),
				"Instructions",
				OffsetDateTime.parse("2026-09-15T00:00:00Z"),
				OffsetDateTime.parse("2026-09-20T23:59:00Z"),
				2,
				false,
				AssignmentStatus.DRAFT));
		AssignmentModule foreignModule = moduleRepository.save(new AssignmentModule(
				foreignAssignment.getId(),
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Foreign question module",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				"Grade reading"));
		Question foreignQuestion = questionRepository.save(new Question(
				foreignModule.getId(),
				"Foreign question",
				QuestionType.SHORT_ANSWER,
				"{\"correct_answer\":\"English\"}",
				BigDecimal.ONE,
				1));

		mockMvc.perform(get("/api/v1/modules/{id}/questions", foreignModule.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/modules/{id}/questions", foreignModule.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
			.andExpect(status().isForbidden());

		mockMvc.perform(get("/api/v1/questions/{id}", foreignQuestion.getId())
					.header("Authorization", bearer(teacherId, UserRole.TEACHER)))
			.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/questions/{id}", foreignQuestion.getId())
					.header("Authorization", bearer(studentId, UserRole.STUDENT)))
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
	void createPersistsMultipleChoiceAnswerAsSnakeCaseJson() throws Exception {
		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Pick one","questionType":"MULTIPLE_CHOICE",
						"correctAnswer":{"options":[
						  {"id":1,"content":"Option A","isCorrect":true},
						  {"id":2,"content":"Option B","isCorrect":false},
						  {"id":3,"content":"Option C","isCorrect":false},
						  {"id":4,"content":"Option D","isCorrect":false}
						]},"score":2.50,"orderIndex":2}
						"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Tạo câu hỏi thành công."));

		questionRepository.flush();
		Question created = questionRepository
				.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
				.filter(candidate -> candidate.getOrderIndex() == 2)
				.findFirst()
				.orElseThrow();

		assertThat(created.getQuestionType()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
		assertThat(created.getScore()).isEqualByComparingTo(new BigDecimal("2.50"));
		assertThat(created.getCorrectAnswer())
				.contains("\"is_correct\":true")
				.contains("\"content\":\"Option A\"")
				.doesNotContain("isCorrect");
	}

	@Test
	void createAcceptsLegacySnakeCaseCorrectAnswerKeys() throws Exception {
		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Pick one","questionType":"MULTIPLE_CHOICE",
						"correctAnswer":{"options":[
						  {"id":1,"content":"A","is_correct":true},
						  {"id":2,"content":"B","is_correct":false},
						  {"id":3,"content":"C","is_correct":false},
						  {"id":4,"content":"D","is_correct":false}
						]},"orderIndex":2}
						"""))
				.andExpect(status().isCreated());

		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Name a subject","questionType":"SHORT_ANSWER",
						"correctAnswer":{"correct_answer":"English"},"orderIndex":3}
						"""))
				.andExpect(status().isCreated());
	}

	@Test
	void createRejectsUnrecognisedCorrectAnswerShape() throws Exception {
		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Pick one","questionType":"MULTIPLE_CHOICE",
						"correctAnswer":{"answer":"Option A"},"orderIndex":2}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						org.hamcrest.Matchers.startsWith("correctAnswer phải là")));
	}

	@Test
	void createRejectsInvalidCorrectAnswerStructure() throws Exception {
		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Pick one","questionType":"MULTIPLE_CHOICE",
						"correctAnswer":{"options":[
						  {"id":1,"content":"A","isCorrect":true},
						  {"id":2,"content":"B","isCorrect":false}
						]},"orderIndex":2}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("options phải có đúng 4 lựa chọn."));

		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Pick one","questionType":"MULTIPLE_CHOICE",
						"correctAnswer":{"options":[
						  {"id":1,"content":"A","isCorrect":true},
						  {"id":2,"content":"B","isCorrect":true},
						  {"id":3,"content":"C","isCorrect":false},
						  {"id":4,"content":"D","isCorrect":false}
						]},"orderIndex":2}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						"options phải có đúng một lựa chọn đúng và id không được trùng."));

		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"Name a subject","questionType":"SHORT_ANSWER",
						"correctAnswer":{"correctAnswer":"   "},"orderIndex":2}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("correctAnswer không được để trống."));
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 2, 3})
	void updateRejectsNullCorrectAnswerOptionBeforeService(int nullIndex) throws Exception {
		entityManager.flush();
		entityManager.clear();
		Question before = questionRepository.findById(questionId).orElseThrow();
		UpdateQuestionRequest request = new UpdateQuestionRequest(
				null, correctAnswerWithNullOption(nullIndex), null, null);
		String body = objectMapper.writeValueAsString(request);
		UpdateQuestionRequest parsed = objectMapper.readValue(body, UpdateQuestionRequest.class);
		assertThat(parsed.correctAnswer()).isInstanceOf(MultipleChoiceCorrectAnswer.class);
		MultipleChoiceCorrectAnswer answer = (MultipleChoiceCorrectAnswer) parsed.correctAnswer();
		assertThat(answer.options()).hasSize(4);
		assertThat(answer.options().get(nullIndex)).isNull();

		ResultActions result = performWithExceptionDetails("A.02 nullIndex=" + nullIndex,
				put("/api/v1/questions/{id}", questionId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body));
		assertNullOptionRejected(result, nullIndex);
		entityManager.flush();
		entityManager.clear();
		Question after = questionRepository.findById(questionId).orElseThrow();
		assertThat(after.getModuleId()).isEqualTo(before.getModuleId());
		assertThat(after.getContent()).isEqualTo(before.getContent());
		assertThat(after.getQuestionType()).isEqualTo(before.getQuestionType());
		assertThat(after.getCorrectAnswer()).isEqualTo(before.getCorrectAnswer());
		assertThat(after.getScore()).isEqualByComparingTo(before.getScore());
		assertThat(after.getOrderIndex()).isEqualTo(before.getOrderIndex());
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 2, 3})
	void createRejectsNullCorrectAnswerOptionBeforeService(int nullIndex) throws Exception {
		entityManager.flush();
		entityManager.clear();
		List<Question> before = questionRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
		Question existing = questionRepository.findById(questionId).orElseThrow();
		CreateQuestionRequest request = new CreateQuestionRequest(
				existing.getContent(),
				com.english_hub.core.modules.question.domain.model.QuestionType.valueOf(existing.getQuestionType().name()),
				correctAnswerWithNullOption(nullIndex),
				existing.getScore(), existing.getOrderIndex() + 1);
		String body = objectMapper.writeValueAsString(request);
		CreateQuestionRequest parsed = objectMapper.readValue(body, CreateQuestionRequest.class);
		assertThat(parsed.correctAnswer()).isInstanceOf(MultipleChoiceCorrectAnswer.class);
		MultipleChoiceCorrectAnswer answer = (MultipleChoiceCorrectAnswer) parsed.correctAnswer();
		assertThat(answer.options()).hasSize(4);
		assertThat(answer.options().get(nullIndex)).isNull();

		ResultActions result = performWithExceptionDetails("A.03 nullIndex=" + nullIndex,
				post("/api/v1/modules/{id}/questions", moduleId)
						.header("Authorization", bearer(teacherId, UserRole.TEACHER))
						.contentType(MediaType.APPLICATION_JSON)
						.content(body));
		assertNullOptionRejected(result, nullIndex);
		entityManager.flush();
		entityManager.clear();
		assertThat(questionRepository.findByModuleIdOrderByOrderIndexAsc(moduleId))
				.extracting(Question::getId)
				.containsExactlyElementsOf(before.stream().map(Question::getId).toList());
	}

	@Test
	void updatePersistsTypedCorrectAnswerAndRejectsInvalidShape() throws Exception {
		mockMvc.perform(put("/api/v1/questions/{id}", questionId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"correctAnswer":{"options":[
						  {"id":1,"content":"A","isCorrect":false},
						  {"id":2,"content":"B","isCorrect":true},
						  {"id":3,"content":"C","isCorrect":false},
						  {"id":4,"content":"D","isCorrect":false}
						]}}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật câu hỏi thành công."));

		questionRepository.flush();
		assertThat(questionRepository.findById(questionId).orElseThrow().getCorrectAnswer())
				.contains("\"is_correct\":true")
				.contains("\"content\":\"B\"");

		mockMvc.perform(put("/api/v1/questions/{id}", questionId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"correctAnswer\":{\"answer\":\"A\"}}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						org.hamcrest.Matchers.startsWith("correctAnswer phải là")));
	}

	@Test
	void audit03CreateRejectsMismatchedQuestionTypeAndAnswerShape() throws Exception {
		long countBefore = questionRepository.count();

		// MCQ with ShortAnswer shape
		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"QA mismatch MCQ with ShortAnswer",
						"questionType":"MULTIPLE_CHOICE",
						"correctAnswer":{"correctAnswer":"QA answer"},
						"score":1.00,"orderIndex":99}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						org.hamcrest.Matchers.startsWith("correctAnswer phải là")));

		// ShortAnswer with MCQ shape
		mockMvc.perform(post("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"content":"QA mismatch ShortAnswer with MCQ",
						"questionType":"SHORT_ANSWER",
						"correctAnswer":{"options":[
						  {"id":1,"content":"A","isCorrect":true},
						  {"id":2,"content":"B","isCorrect":false},
						  {"id":3,"content":"C","isCorrect":false},
						  {"id":4,"content":"D","isCorrect":false}
						]},
						"score":1.00,"orderIndex":100}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value(
						org.hamcrest.Matchers.startsWith("correctAnswer phải là")));

		entityManager.flush();
		entityManager.clear();
		assertThat(questionRepository.count()).isEqualTo(countBefore);
	}

	@Test
	void audit03UpdateRejectsMismatchedCorrectAnswerShape() throws Exception {
		entityManager.flush();
		entityManager.clear();
		String originalMcqAnswer = questionRepository.findById(questionId).orElseThrow().getCorrectAnswer();

		// Update existing MCQ question with ShortAnswer shape (questionType omitted from body)
		mockMvc.perform(put("/api/v1/questions/{id}", questionId)
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"correctAnswer":{"correctAnswer":"QA answer"}}
						"""))
				.andExpect(status().isBadRequest());

		entityManager.flush();
		entityManager.clear();
		assertThat(questionRepository.findById(questionId).orElseThrow().getCorrectAnswer())
				.isEqualTo(originalMcqAnswer);

		// Create a separate SHORT_ANSWER question to test updating ShortAnswer with MCQ shape
		Question shortAnswerQuestion = questionRepository.save(new Question(
				moduleId,
				"Short answer question",
				com.english_hub.core.infrastructure.persistence.entity.QuestionType.SHORT_ANSWER,
				"{\"correct_answer\":\"original answer\"}",
				BigDecimal.ONE,
				88));
		entityManager.flush();
		entityManager.clear();

		// Update existing ShortAnswer question with MCQ shape
		mockMvc.perform(put("/api/v1/questions/{id}", shortAnswerQuestion.getId())
				.header("Authorization", bearer(teacherId, UserRole.TEACHER))
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"correctAnswer":{"options":[
						  {"id":1,"content":"A","isCorrect":true},
						  {"id":2,"content":"B","isCorrect":false},
						  {"id":3,"content":"C","isCorrect":false},
						  {"id":4,"content":"D","isCorrect":false}
						]}}
						"""))
				.andExpect(status().isBadRequest());

		entityManager.flush();
		entityManager.clear();
		assertThat(questionRepository.findById(shortAnswerQuestion.getId()).orElseThrow().getCorrectAnswer())
				.isEqualTo("{\"correct_answer\":\"original answer\"}");
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

	@Test
	void publicOptionsAreAvailableToBothRolesWithoutChangingStoredAnswer() throws Exception {
		String storedAnswer = questionRepository.findById(questionId).orElseThrow().getCorrectAnswer();
		for (UserRole role : List.of(UserRole.TEACHER, UserRole.STUDENT)) {
			Long userId = role == UserRole.TEACHER ? teacherId : studentId;
			var listResult = mockMvc.perform(get("/api/v1/modules/{id}/questions", moduleId)
					.header("Authorization", bearer(userId, role)))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.data[0].options", hasSize(4)))
					.andReturn();
			var detailResult = mockMvc.perform(get("/api/v1/questions/{id}", questionId)
					.header("Authorization", bearer(userId, role)))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.options", hasSize(4)))
					.andReturn();

			JsonMapper mapper = JsonMapper.builder().build();
			var listQuestion = mapper.readTree(listResult.getResponse().getContentAsString()).get("data").get(0);
			var detailQuestion = mapper.readTree(detailResult.getResponse().getContentAsString());
			assertPublicOptions(listQuestion, role);
			assertPublicOptions(detailQuestion, role);
		}
		questionRepository.flush();
		assertThat(questionRepository.findById(questionId).orElseThrow().getCorrectAnswer()).isEqualTo(storedAnswer);
		assertThat(storedAnswer).contains("is_correct").doesNotContain("isCorrect");
	}

	@Test
	void shortAnswerOptionsAreOmittedInJsonForBothRoles() throws Exception {
		Question shortAnswer = questionRepository.save(new Question(
				moduleId,
				"What should you show at an airport before an international flight?",
				QuestionType.SHORT_ANSWER,
				"{\"correct_answer\":\"passport\"}",
				BigDecimal.ONE,
				2));
		for (UserRole role : List.of(UserRole.TEACHER, UserRole.STUDENT)) {
			Long userId = role == UserRole.TEACHER ? teacherId : studentId;
			mockMvc.perform(get("/api/v1/modules/{id}/questions", moduleId)
					.header("Authorization", bearer(userId, role)))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.data", hasSize(2)))
					.andExpect(jsonPath("$.data[1].options").doesNotExist());
			mockMvc.perform(get("/api/v1/questions/{id}", shortAnswer.getId())
					.header("Authorization", bearer(userId, role)))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.options").doesNotExist());
		}
	}

	@Test
	void studentWithoutClassMembershipCannotReadEitherQuestionEndpoint() throws Exception {
		mockMvc.perform(get("/api/v1/modules/{id}/questions", moduleId)
				.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
		mockMvc.perform(get("/api/v1/questions/{id}", questionId)
				.header("Authorization", bearer(otherStudentId, UserRole.STUDENT)))
				.andExpect(status().isForbidden());
	}

	private MultipleChoiceCorrectAnswer correctAnswerWithNullOption(int nullIndex) {
		String storedAnswer = questionRepository.findById(questionId).orElseThrow().getCorrectAnswer();
		UpdateQuestionRequest parsed = objectMapper.readValue(
				"{\"correctAnswer\":" + storedAnswer + "}", UpdateQuestionRequest.class);
		MultipleChoiceCorrectAnswer answer = (MultipleChoiceCorrectAnswer) parsed.correctAnswer();
		List<QuestionOption> options = new ArrayList<>(answer.options());
		options.set(nullIndex, null);
		return new MultipleChoiceCorrectAnswer(options);
	}

	private void assertNullOptionRejected(ResultActions result, int nullIndex) throws Exception {
		result.andExpect(status().isBadRequest());
		MvcResult response = result.andReturn();
		assertThat(response.getResolvedException()).isInstanceOf(MethodArgumentNotValidException.class);
		MethodArgumentNotValidException exception =
				(MethodArgumentNotValidException) response.getResolvedException();
		assertThat(exception.getBindingResult().getFieldError("correctAnswer.options[" + nullIndex + "]"))
				.isNotNull();
		assertThat(objectMapper.readTree(response.getResponse().getContentAsString()))
				.isEqualTo(objectMapper.readTree(objectMapper.writeValueAsString(
						java.util.Map.of("error", NULL_OPTION_MESSAGE))));
	}

	private ResultActions performWithExceptionDetails(
			String scenario, MockHttpServletRequestBuilder request) throws Exception {
		try {
			ResultActions result = mockMvc.perform(request);
			MvcResult response = result.andReturn();
			System.out.println("BE-68 " + scenario + " HTTP " + response.getResponse().getStatus());
			printExceptionChain(scenario, response.getResolvedException());
			return result;
		} catch (Exception exception) {
			printExceptionChain(scenario, exception);
			throw exception;
		}
	}

	private void printExceptionChain(String scenario, Throwable exception) {
		if (exception == null) {
			System.out.println("BE-68 " + scenario + " exception: none");
		}
		while (exception != null) {
			System.out.println("BE-68 " + scenario + " exception: " + exception.getClass().getName()
					+ ": " + exception.getMessage());
			exception = exception.getCause();
		}
	}

	private void assertPublicOptions(JsonNode response, UserRole role) {
		JsonNode options = response.get("options");
		for (int i = 0; i < 4; i++) {
			JsonNode option = options.get(i);
			assertThat(option.size()).isEqualTo(2);
			assertThat(option.get("id").asInt()).isEqualTo(i + 1);
			assertThat(option.get("content").asString()).isEqualTo(List.of("A", "B", "C", "D").get(i));
			assertThat(option.has("isCorrect")).isFalse();
			assertThat(option.has("is_correct")).isFalse();
		}
		if (role == UserRole.TEACHER) {
			assertTeacherAnswer(response.get("correctAnswer").get("options"), options);
		} else {
			assertThat(response.has("correctAnswer")).isFalse();
		}
	}

	private void assertTeacherAnswer(JsonNode answer, JsonNode publicOptions) {
		assertThat(answer.size()).isEqualTo(4);
		for (int i = 0; i < 4; i++) {
			assertThat(answer.get(i).get("id")).isEqualTo(publicOptions.get(i).get("id"));
			assertThat(answer.get(i).get("content")).isEqualTo(publicOptions.get(i).get("content"));
			assertThat(answer.get(i).get("isCorrect").asBoolean()).isEqualTo(i == 0);
		}
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
