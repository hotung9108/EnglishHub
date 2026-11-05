package com.english_hub.core.modules.submission.presentation.rest;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.submission.application.port.StorageService;
import com.english_hub.core.modules.submission.application.service.SubmissionService;
import com.english_hub.core.modules.submission.domain.model.Answer;
import com.english_hub.core.modules.submission.domain.model.AssignmentStatus;
import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;
import com.english_hub.core.modules.submission.domain.model.QuestionDetail;
import com.english_hub.core.modules.submission.domain.model.QuestionType;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.AnswerRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentWindowRepository;
import com.english_hub.core.modules.submission.domain.repository.ClassTeachingRepository;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.ModuleQuestionRepository;
import com.english_hub.core.modules.submission.domain.repository.StudentClassEnrollmentRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class SubmissionModuleReadMockMvcTest {

	private static final long SUBMISSION_MODULE_ID = 150L;
	private static final long SUBMISSION_ID = 88L;
	private static final long MODULE_ID = 9L;
	private static final long ASSIGNMENT_ID = 5L;
	private static final long CLASS_ID = 3L;
	private static final long STUDENT_ID = 41L;
	private static final long TEACHER_ID = 7L;
	private static final long ADMIN_ID = 1L;
	private static final String ESSAY_CONTENT = "Technology improves education.";

	@Mock
	private SubmissionRepository submissionRepository;
	@Mock
	private SubmissionModuleRepository submissionModuleRepository;
	@Mock
	private GradingRepository gradingRepository;
	@Mock
	private AssignmentWindowRepository assignmentWindowRepository;
	@Mock
	private AssignmentModuleRepository assignmentModuleRepository;
	@Mock
	private StudentClassEnrollmentRepository studentClassEnrollmentRepository;
	@Mock
	private ClassTeachingRepository classTeachingRepository;
	@Mock
	private AnswerRepository answerRepository;
	@Mock
	private ModuleQuestionRepository moduleQuestionRepository;
	@Mock
	private CurrentUserProvider currentUserProvider;
	@Mock
	private StorageService storageService;
	@Mock
	private ApplicationEventPublisher eventPublisher;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		SubmissionService service = new SubmissionService(
				submissionRepository, submissionModuleRepository, gradingRepository, assignmentWindowRepository,
				assignmentModuleRepository, studentClassEnrollmentRepository, classTeachingRepository,
				answerRepository, moduleQuestionRepository, currentUserProvider, new JsonMapper(),
				storageService, eventPublisher);
		mockMvc = MockMvcBuilders.standaloneSetup(new SubmissionController(service))
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	@ParameterizedTest(name = "{0}, {1}, {2}")
	@MethodSource("moduleReadCases")
	void serializesModuleAnswersForAuthorizedReaders(
			UserRole role, SubmissionStatus moduleStatus, ModuleTaskType taskType) throws Exception {
		prepareRead(role, moduleStatus, taskType);

		ResultActions response = mockMvc.perform(get("/api/v1/submission-modules/{id}", SUBMISSION_MODULE_ID))
				.andExpect(status().isOk())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
				.andExpect(jsonPath("$.status").value(moduleStatus.name()))
				.andExpect(jsonPath("$.questions.length()").value(taskType == ModuleTaskType.QUIZ ? 2 : 0));

		if (taskType == ModuleTaskType.ESSAY) {
			response.andExpect(jsonPath("$.answers[0].questionId").value(nullValue()))
					.andExpect(jsonPath("$.answers[0].content").value(ESSAY_CONTENT));
			return;
		}
		response.andExpect(jsonPath("$.answers[?(@.questionId == 21)].content.selectedOptionIds[*]").value(contains(1)))
				.andExpect(jsonPath("$.answers[?(@.questionId == 22)].content.text").value(contains("English")))
				.andExpect(jsonPath("$.answers[*].content.selected_option_ids").doesNotExist())
				.andExpect(jsonPath("$.answers[*].content.answer_text").doesNotExist())
				.andExpect(jsonPath("$.answers[*].content.is_correct").doesNotExist());

		if (moduleStatus == SubmissionStatus.GRADED) {
			response.andExpect(jsonPath("$.questions[?(@.questionType == 'MULTIPLE_CHOICE')].correctAnswer.options[*].isCorrect")
						.value(contains(true, false)))
					.andExpect(jsonPath("$.questions[?(@.questionType == 'SHORT_ANSWER')].correctAnswer.correctAnswer")
							.value(contains("English")))
					.andExpect(jsonPath("$.questions[*].correctAnswer..is_correct").doesNotExist())
					.andExpect(jsonPath("$.questions[*].correctAnswer..correct_answer").doesNotExist())
					.andExpect(jsonPath("$.answers[*].content.isCorrect").value(contains(true, false)));
		} else {
			response.andExpect(jsonPath("$.questions[0].correctAnswer").value(nullValue()))
					.andExpect(jsonPath("$.questions[1].correctAnswer").value(nullValue()));
		}
	}

	private void prepareRead(UserRole role, SubmissionStatus moduleStatus, ModuleTaskType taskType) {
		long callerId = switch (role) {
			case STUDENT -> STUDENT_ID;
			case TEACHER -> TEACHER_ID;
			case ADMIN -> ADMIN_ID;
		};
		when(currentUserProvider.requireActiveUser()).thenReturn(new User(
				callerId, "Caller", "caller@example.com", null, null, "hash", role, UserStatus.ACTIVE,
				false, null, null, null, null));
		SubmissionModule module = new SubmissionModule(SUBMISSION_ID, MODULE_ID, moduleStatus);
		module.setId(SUBMISSION_MODULE_ID);
		when(submissionModuleRepository.findById(SUBMISSION_MODULE_ID)).thenReturn(Optional.of(module));
		Submission submission = new Submission(ASSIGNMENT_ID, STUDENT_ID, 1, null, SubmissionStatus.SUBMITTED);
		submission.setId(SUBMISSION_ID);
		when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
		if (role == UserRole.TEACHER) {
			when(assignmentWindowRepository.findWindowById(ASSIGNMENT_ID)).thenReturn(Optional.of(new AssignmentWindow(
					ASSIGNMENT_ID, CLASS_ID, AssignmentStatus.PUBLISHED, null, null, null, false)));
			when(classTeachingRepository.isTeacherOfClass(TEACHER_ID, CLASS_ID)).thenReturn(true);
		}
		ModuleSkill skill = taskType == ModuleTaskType.ESSAY ? ModuleSkill.WRITING : ModuleSkill.READING;
		when(assignmentModuleRepository.findModulesByAssignmentId(ASSIGNMENT_ID)).thenReturn(List.of(
				new ModuleInfo(MODULE_ID, ASSIGNMENT_ID, skill, taskType, 1, BigDecimal.TEN)));
		if (taskType == ModuleTaskType.ESSAY) {
			when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(
					new Answer(SUBMISSION_MODULE_ID, null, ESSAY_CONTENT)));
			return;
		}
		when(moduleQuestionRepository.findDetailsByModuleId(MODULE_ID)).thenReturn(List.of(
				new QuestionDetail(21L, MODULE_ID, QuestionType.MULTIPLE_CHOICE, BigDecimal.ONE, 1, "Choose an option.",
						"{\"options\":[{\"id\":1,\"is_correct\":true},{\"id\":2,\"is_correct\":false}]}"),
				new QuestionDetail(22L, MODULE_ID, QuestionType.SHORT_ANSWER, BigDecimal.ONE, 2, "Write the answer.",
						"{\"correct_answer\":\"English\"}")));
		String mcContent = moduleStatus == SubmissionStatus.GRADED
				? "{\"selected_option_ids\":[1],\"is_correct\":true,\"score\":1}"
				: "{\"selected_option_ids\":[1]}";
		String saContent = moduleStatus == SubmissionStatus.GRADED
				? "{\"answer_text\":\"English\",\"is_correct\":false,\"score\":0}"
				: "{\"answer_text\":\"English\"}";
		when(answerRepository.findBySubmissionModuleId(SUBMISSION_MODULE_ID)).thenReturn(List.of(
				new Answer(SUBMISSION_MODULE_ID, 21L, mcContent), new Answer(SUBMISSION_MODULE_ID, 22L, saContent)));
	}

	static Stream<Arguments> moduleReadCases() {
		return Stream.of(
				Arguments.of(UserRole.STUDENT, SubmissionStatus.GRADED, ModuleTaskType.QUIZ),
				Arguments.of(UserRole.TEACHER, SubmissionStatus.GRADED, ModuleTaskType.QUIZ),
				Arguments.of(UserRole.ADMIN, SubmissionStatus.GRADED, ModuleTaskType.QUIZ),
				Arguments.of(UserRole.STUDENT, SubmissionStatus.SUBMITTED, ModuleTaskType.QUIZ),
				Arguments.of(UserRole.STUDENT, SubmissionStatus.SUBMITTED, ModuleTaskType.ESSAY));
	}
}
