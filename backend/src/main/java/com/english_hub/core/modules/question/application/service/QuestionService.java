package com.english_hub.core.modules.question.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.question.application.command.CreateQuestionCommand;
import com.english_hub.core.modules.question.application.command.UpdateQuestionCommand;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import com.english_hub.core.modules.question.domain.repository.QuestionRepository;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class QuestionService {

	private static final String QUESTION_NOT_FOUND_MESSAGE = "Không tìm thấy câu hỏi.";
	private static final String MODULE_NOT_FOUND_MESSAGE = "Không tìm thấy module.";
	private static final String ASSIGNMENT_NOT_FOUND_MESSAGE = "Không tìm thấy bài tập.";
	private static final String CLASS_NOT_FOUND_MESSAGE = "Không tìm thấy lớp học.";
	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String INVALID_QUESTION_MESSAGE = "Dữ liệu câu hỏi không hợp lệ.";
	private static final String INVALID_CORRECT_ANSWER_MESSAGE = "Cấu trúc correctAnswer không hợp lệ.";
	private static final String CREATE_ORDER_CONFLICT_MESSAGE = "orderIndex đã được sử dụng trong module này.";
	private static final String UPDATE_ORDER_CONFLICT_MESSAGE = "orderIndex đã được sử dụng.";
	private static final String ANSWER_REFERENCE_MESSAGE = "Không thể xoá câu hỏi đã có câu trả lời.";
	private static final BigDecimal DEFAULT_SCORE = BigDecimal.ONE;

	private final QuestionRepository questionRepository;
	private final ModuleRepository moduleRepository;
	private final AssignmentRepository assignmentRepository;
	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;

	public QuestionService(
			QuestionRepository questionRepository,
			ModuleRepository moduleRepository,
			AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider) {
		this.questionRepository = questionRepository;
		this.moduleRepository = moduleRepository;
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
	}

	@Transactional(readOnly = true)
	public QuestionListResult listQuestions(long moduleId) {
		QuestionAccess access = requireReadAccess(moduleId);
		return new QuestionListResult(
				access.questions(),
				access.includeCorrectAnswer());
	}

	@Transactional
	public long createQuestion(long moduleId, CreateQuestionCommand command) {
		User caller = requireTeacher();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		validateCreateCommand(command);
		if (questionRepository.existsByModuleIdAndOrderIndex(moduleId, command.orderIndex())) {
			throw ApiException.badRequest(CREATE_ORDER_CONFLICT_MESSAGE);
		}

		BigDecimal score = command.score() == null ? DEFAULT_SCORE : command.score();
		Question question = new Question(
				null,
				moduleId,
				command.content(),
				command.questionType(),
				command.correctAnswer(),
				score,
				command.orderIndex());
		return questionRepository.save(question).id();
	}

	@Transactional(readOnly = true)
	public QuestionResult getQuestion(long questionId) {
		User caller = currentUserProvider.requireActiveUser();
		Question question = requireQuestion(questionId);
		Module module = requireModule(question.moduleId());
		Assignment assignment = requireAssignment(module.assignmentId());
		boolean includeCorrectAnswer = requireReadAccess(assignment, caller);
		return new QuestionResult(question, includeCorrectAnswer);
	}

	@Transactional
	public void updateQuestion(long questionId, UpdateQuestionCommand command) {
		User caller = requireTeacher();
		Question question = requireQuestion(questionId);
		Module module = requireModule(question.moduleId());
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (command == null || hasNoUpdateFields(command)) {
			throw ApiException.badRequest(INVALID_QUESTION_MESSAGE);
		}

		String content = command.content() == null ? question.content() : command.content();
		if (content == null || content.isBlank()) {
			throw ApiException.badRequest(INVALID_QUESTION_MESSAGE);
		}

		Map<String, Object> correctAnswer = command.correctAnswer() == null
				? question.correctAnswer()
				: command.correctAnswer();
		if (command.correctAnswer() != null) {
			validateCorrectAnswer(question.questionType(), correctAnswer);
		}

		BigDecimal score = command.score() == null ? question.score() : command.score();
		int orderIndex = command.orderIndex() == null ? question.orderIndex() : command.orderIndex();
		validateScoreAndOrder(score, orderIndex);
		if (questionRepository.existsByModuleIdAndOrderIndexAndIdNot(
				question.moduleId(), orderIndex, question.id())) {
			throw ApiException.badRequest(UPDATE_ORDER_CONFLICT_MESSAGE);
		}

		questionRepository.save(new Question(
				question.id(),
				question.moduleId(),
				content,
				question.questionType(),
				correctAnswer,
				score,
				orderIndex));
	}

	@Transactional
	public void deleteQuestion(long questionId) {
		User caller = requireTeacher();
		Question question = requireQuestion(questionId);
		Module module = requireModule(question.moduleId());
		Assignment assignment = requireAssignment(module.assignmentId());
		requireTeacherOwnsAssignment(assignment, caller);
		if (questionRepository.existsAnswerReference(questionId)) {
			throw ApiException.badRequest(ANSWER_REFERENCE_MESSAGE);
		}
		questionRepository.deleteById(questionId);
	}

	private User requireTeacher() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private QuestionAccess requireReadAccess(long moduleId) {
		User caller = currentUserProvider.requireActiveUser();
		Module module = requireModule(moduleId);
		Assignment assignment = requireAssignment(module.assignmentId());
		boolean includeCorrectAnswer = requireReadAccess(assignment, caller);
		return new QuestionAccess(
				questionRepository.findByModuleIdOrderByOrderIndexAsc(moduleId),
				includeCorrectAnswer);
	}

	private boolean requireReadAccess(Assignment assignment, User caller) {
		EnglishClass englishClass = requireClass(assignment.classId());
		if (caller.role() == UserRole.TEACHER
				&& Objects.equals(englishClass.getTeacherId(), caller.id())) {
			return true;
		}
		if (caller.role() == UserRole.STUDENT
				&& classMemberRepository.existsByClassIdAndStudentId(assignment.classId(), caller.id())) {
			return false;
		}
		throw ApiException.forbidden(FORBIDDEN_MESSAGE);
	}

	private void requireTeacherOwnsAssignment(Assignment assignment, User caller) {
		EnglishClass englishClass = requireClass(assignment.classId());
		if (!Objects.equals(englishClass.getTeacherId(), caller.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private Question requireQuestion(long questionId) {
		return questionRepository.findById(questionId)
				.orElseThrow(() -> ApiException.notFound(QUESTION_NOT_FOUND_MESSAGE));
	}

	private Module requireModule(long moduleId) {
		return moduleRepository.findById(moduleId)
				.orElseThrow(() -> ApiException.notFound(MODULE_NOT_FOUND_MESSAGE));
	}

	private Assignment requireAssignment(long assignmentId) {
		return assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
	}

	private EnglishClass requireClass(long classId) {
		return classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
	}

	private void validateCreateCommand(CreateQuestionCommand command) {
		if (command == null
				|| command.content() == null
				|| command.content().isBlank()
				|| command.questionType() == null
				|| command.correctAnswer() == null
				|| command.orderIndex() <= 0) {
			throw ApiException.badRequest(INVALID_QUESTION_MESSAGE);
		}
		validateScoreAndOrder(command.score() == null ? DEFAULT_SCORE : command.score(), command.orderIndex());
		validateCorrectAnswer(command.questionType(), command.correctAnswer());
	}

	private void validateScoreAndOrder(BigDecimal score, int orderIndex) {
		if (score == null || score.compareTo(BigDecimal.ZERO) < 0 || orderIndex <= 0) {
			throw ApiException.badRequest(INVALID_QUESTION_MESSAGE);
		}
	}

	private void validateCorrectAnswer(QuestionType questionType, Map<String, Object> correctAnswer) {
		if (correctAnswer == null || correctAnswer.isEmpty()) {
			throw ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
		}
		if (questionType == QuestionType.MULTIPLE_CHOICE) {
			validateMultipleChoice(correctAnswer);
			return;
		}
		Object answer = valueOf(correctAnswer, "correctAnswer", "correct_answer");
		if (!(answer instanceof String text) || text.isBlank()) {
			throw ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
		}
	}

	private void validateMultipleChoice(Map<String, Object> correctAnswer) {
		Object rawOptions = correctAnswer.get("options");
		if (!(rawOptions instanceof List<?> options) || options.size() != 4) {
			throw ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
		}

		Set<Integer> optionIds = new HashSet<>();
		int correctOptionCount = 0;
		for (Object rawOption : options) {
			if (!(rawOption instanceof Map<?, ?> option)) {
				throw ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
			}
			Integer optionId = positiveInteger(option.get("id"));
			Object content = option.get("content");
			Object isCorrect = valueOf(option, "isCorrect", "is_correct");
			if (optionId == null
					|| !optionIds.add(optionId)
					|| !(content instanceof String text)
					|| text.isBlank()
					|| !(isCorrect instanceof Boolean)) {
				throw ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
			}
			if ((Boolean) isCorrect) {
				correctOptionCount++;
			}
		}
		if (correctOptionCount != 1) {
			throw ApiException.badRequest(INVALID_CORRECT_ANSWER_MESSAGE);
		}
	}

	private Integer positiveInteger(Object value) {
		if (!(value instanceof Number number)) {
			return null;
		}
		long longValue = number.longValue();
		if (longValue <= 0 || number.doubleValue() != longValue) {
			return null;
		}
		return longValue > Integer.MAX_VALUE ? null : (int) longValue;
	}

	private Object valueOf(Map<?, ?> values, String primaryKey, String fallbackKey) {
		return values.containsKey(primaryKey) ? values.get(primaryKey) : values.get(fallbackKey);
	}

	private boolean hasNoUpdateFields(UpdateQuestionCommand command) {
		return command.content() == null
				&& command.correctAnswer() == null
				&& command.score() == null
				&& command.orderIndex() == null;
	}

	public record QuestionListResult(List<Question> questions, boolean includeCorrectAnswer) {
	}

	public record QuestionResult(Question question, boolean includeCorrectAnswer) {
	}

	private record QuestionAccess(List<Question> questions, boolean includeCorrectAnswer) {
	}
}
