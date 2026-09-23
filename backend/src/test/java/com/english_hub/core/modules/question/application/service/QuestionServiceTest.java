package com.english_hub.core.modules.question.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.question.application.command.CreateQuestionCommand;
import com.english_hub.core.modules.question.application.command.UpdateQuestionCommand;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import com.english_hub.core.modules.question.domain.repository.QuestionRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class QuestionServiceTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");

	@Mock
	private QuestionRepository questionRepository;

	@Mock
	private ModuleRepository moduleRepository;

	@Mock
	private AssignmentRepository assignmentRepository;

	@Mock
	private ClassRepository classRepository;

	@Mock
	private ClassMemberRepository classMemberRepository;

	@Mock
	private CurrentUserProvider currentUserProvider;

	private QuestionService questionService;

	@BeforeEach
	void setUp() {
		questionService = new QuestionService(
				questionRepository,
				moduleRepository,
				assignmentRepository,
				classRepository,
				classMemberRepository,
				currentUserProvider);
	}

	@Test
	void teacherOwnerCanListQuestionsInOrderWithCorrectAnswer() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		Question first = question(21L, 9L, QuestionType.MULTIPLE_CHOICE, 1);
		Question second = question(22L, 9L, QuestionType.SHORT_ANSWER, 2);
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(9L)).thenReturn(List.of(first, second));

		QuestionService.QuestionListResult result = questionService.listQuestions(9L);

		assertThat(result.questions()).containsExactly(first, second);
		assertThat(result.includeCorrectAnswer()).isTrue();
	}

	@Test
	void studentMemberCanListQuestionsWithoutCorrectAnswer() {
		givenCaller(user(41L, UserRole.STUDENT));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		when(classMemberRepository.existsByClassIdAndStudentId(3L, 41L)).thenReturn(true);
		when(questionRepository.findByModuleIdOrderByOrderIndexAsc(9L)).thenReturn(List.of());

		QuestionService.QuestionListResult result = questionService.listQuestions(9L);

		assertThat(result.questions()).isEmpty();
		assertThat(result.includeCorrectAnswer()).isFalse();
	}

	@Test
	void adminCannotReadQuestions() {
		givenCaller(user(1L, UserRole.ADMIN));
		givenModuleAndOwner(9L, 5L, 3L, 10L);

		assertApiException(
				() -> questionService.listQuestions(9L),
				"Bạn không có quyền thực hiện thao tác này.");
	}

	@Test
	void teacherOwnerCanCreateQuestionWithDefaultScore() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		when(questionRepository.existsByModuleIdAndOrderIndex(9L, 1)).thenReturn(false);
		Question saved = question(21L, 9L, QuestionType.MULTIPLE_CHOICE, 1);
		when(questionRepository.save(any(Question.class))).thenReturn(saved);

		long id = questionService.createQuestion(
				9L,
				new CreateQuestionCommand(
					"Choose one",
					QuestionType.MULTIPLE_CHOICE,
					multipleChoiceAnswer(),
					null,
					1));

		assertThat(id).isEqualTo(21L);
		verify(questionRepository).save(any(Question.class));
	}

	@Test
	void multipleChoiceMustHaveFourOptionsAndExactlyOneCorrectOption() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);

		Map<String, Object> invalid = new LinkedHashMap<>();
		invalid.put("options", List.of(
				Map.of("id", 1, "content", "A", "isCorrect", true),
				Map.of("id", 2, "content", "B", "isCorrect", false)));

		assertApiException(
				() -> questionService.createQuestion(
						9L,
						new CreateQuestionCommand(
								"Choose one", QuestionType.MULTIPLE_CHOICE, invalid, BigDecimal.ONE, 1)),
				"Cấu trúc correctAnswer không hợp lệ.");
		verify(questionRepository, never()).save(any(Question.class));
	}

	@Test
	void shortAnswerRequiresNonBlankCorrectAnswerText() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);

		assertApiException(
				() -> questionService.createQuestion(
						9L,
						new CreateQuestionCommand(
								"Answer", QuestionType.SHORT_ANSWER, Map.of("correctAnswer", " "), BigDecimal.ONE, 1)),
				"Cấu trúc correctAnswer không hợp lệ.");
	}

	@Test
	void duplicateOrderIsRejectedOnCreate() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		when(questionRepository.existsByModuleIdAndOrderIndex(9L, 1)).thenReturn(true);

		assertApiException(
				() -> questionService.createQuestion(
						9L,
						new CreateQuestionCommand(
								"Choose one", QuestionType.MULTIPLE_CHOICE, multipleChoiceAnswer(), BigDecimal.ONE, 1)),
				"orderIndex đã được sử dụng trong module này.");
	}

	@Test
	void updateKeepsQuestionTypeAndAllowsSelfOrder() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		Question existing = question(21L, 9L, QuestionType.MULTIPLE_CHOICE, 1);
		when(questionRepository.findById(21L)).thenReturn(Optional.of(existing));
		when(questionRepository.existsByModuleIdAndOrderIndexAndIdNot(9L, 1, 21L)).thenReturn(false);
		when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> invocation.getArgument(0));

		questionService.updateQuestion(
				21L,
				new UpdateQuestionCommand("Updated", null, BigDecimal.valueOf(2), 1));

		verify(questionRepository).save(any(Question.class));
		org.mockito.ArgumentCaptor<Question> captor = org.mockito.ArgumentCaptor.forClass(Question.class);
		verify(questionRepository).save(captor.capture());
		assertThat(captor.getValue().questionType()).isEqualTo(QuestionType.MULTIPLE_CHOICE);
		assertThat(captor.getValue().content()).isEqualTo("Updated");
	}

	@Test
	void duplicateOrderIsRejectedOnUpdate() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		when(questionRepository.findById(21L)).thenReturn(Optional.of(question(21L, 9L, QuestionType.SHORT_ANSWER, 1)));
		when(questionRepository.existsByModuleIdAndOrderIndexAndIdNot(9L, 2, 21L)).thenReturn(true);

		assertApiException(
				() -> questionService.updateQuestion(
						21L,
						new UpdateQuestionCommand(null, null, null, 2)),
				"orderIndex đã được sử dụng.");
	}

	@Test
	void deleteRejectsQuestionReferencedByAnswer() {
		givenCaller(user(10L, UserRole.TEACHER));
		givenModuleAndOwner(9L, 5L, 3L, 10L);
		when(questionRepository.findById(21L)).thenReturn(Optional.of(question(21L, 9L, QuestionType.SHORT_ANSWER, 1)));
		when(questionRepository.existsAnswerReference(21L)).thenReturn(true);

		assertApiException(
				() -> questionService.deleteQuestion(21L),
				"Không thể xoá câu hỏi đã có câu trả lời.");
		verify(questionRepository, never()).deleteById(21L);
	}

	private void givenModuleAndOwner(Long moduleId, Long assignmentId, Long classId, Long teacherId) {
		Module value = module(moduleId, assignmentId);
		when(moduleRepository.findById(moduleId)).thenReturn(Optional.of(value));
		lenient().when(moduleRepository.findByIdForUpdate(moduleId)).thenReturn(Optional.of(value));
		when(assignmentRepository.findById(assignmentId)).thenReturn(Optional.of(assignment(assignmentId, classId)));
		when(classRepository.findById(classId)).thenReturn(Optional.of(englishClass(classId, teacherId)));
	}

	private Question question(Long id, Long moduleId, QuestionType type, int orderIndex) {
		return new Question(
				id,
				moduleId,
				"Question " + id,
				type,
				type == QuestionType.MULTIPLE_CHOICE
						? multipleChoiceAnswer()
						: Map.of("correctAnswer", "answer"),
				BigDecimal.ONE,
				orderIndex);
	}

	private Map<String, Object> multipleChoiceAnswer() {
		return Map.of(
				"options",
				List.of(
						Map.of("id", 1, "content", "A", "isCorrect", true),
						Map.of("id", 2, "content", "B", "isCorrect", false),
						Map.of("id", 3, "content", "C", "isCorrect", false),
						Map.of("id", 4, "content", "D", "isCorrect", false)));
	}

	private Module module(Long id, Long assignmentId) {
		return new Module(
				id,
				assignmentId,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Instructions",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null);
	}

	private Assignment assignment(Long id, Long classId) {
		return new Assignment(
				id,
				classId,
				"Assignment",
				"Instructions",
				OPEN_AT,
				CLOSE_AT,
				2,
				AssignmentStatus.DRAFT,
				false,
				null,
				null);
	}

	private EnglishClass englishClass(Long id, Long teacherId) {
		EnglishClass englishClass = new EnglishClass(
				"Class",
				"Intermediate",
				"Description",
				LocalDate.of(2026, 9, 15),
				null,
				ClassStatus.ACTIVE,
				teacherId);
		englishClass.setId(id);
		return englishClass;
	}

	private User user(Long id, UserRole role) {
		User user = User.create(
				role.name(),
				role.name().toLowerCase() + "@englishhub.test",
				null,
				null,
				null,
				role,
				UserStatus.ACTIVE,
				null,
				null,
				null,
				null);
		user.setId(id);
		return user;
	}

	private void givenCaller(User user) {
		when(currentUserProvider.requireActiveUser()).thenReturn(user);
	}

	private void assertApiException(ThrowingOperation operation, String message) {
		assertThatThrownBy(operation::run)
				.isInstanceOf(ApiException.class)
				.hasMessage(message);
	}

	@FunctionalInterface
	private interface ThrowingOperation {
		void run();
	}
}
