package com.english_hub.core.modules.student_evaluation.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.student_evaluation.application.command.CreateStudentEvaluationCommand;
import com.english_hub.core.modules.student_evaluation.application.command.UpdateStudentEvaluationCommand;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationFilter;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationPage;
import com.english_hub.core.modules.student_evaluation.domain.repository.StudentEvaluationRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentEvaluationService {

	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String STUDENT_NOT_FOUND_MESSAGE = "Không tìm thấy học viên.";
	private static final String STUDENT_OR_CLASS_NOT_FOUND_MESSAGE = "Không tìm thấy học viên hoặc lớp học.";
	private static final String EVALUATION_NOT_FOUND_MESSAGE = "Không tìm thấy đánh giá.";
	private static final String STUDENT_NOT_IN_CLASS_MESSAGE = "Học viên không thuộc lớp học này.";
	private static final String EMPTY_CONTENT_MESSAGE = "Nội dung đánh giá không được để trống.";
	private static final String INVALID_PAGE_MESSAGE = "Thông số phân trang hoặc bộ lọc không hợp lệ.";
	private static final String INVALID_REQUEST_MESSAGE = "Dữ liệu không hợp lệ.";

	private final StudentEvaluationRepository studentEvaluationRepository;
	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;

	public StudentEvaluationService(
			StudentEvaluationRepository studentEvaluationRepository,
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider) {
		this.studentEvaluationRepository = studentEvaluationRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
	}

	@Transactional(readOnly = true)
	public StudentEvaluationPage listForStudent(long studentId, Long classId, int page, int limit) {
		User caller = requireReader();
		if (caller.role() == UserRole.STUDENT && !Objects.equals(caller.id(), studentId)) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		validatePage(studentId, classId, page, limit);
		if (!classRepository.studentExists(studentId)) {
			throw ApiException.notFound(STUDENT_NOT_FOUND_MESSAGE);
		}

		StudentEvaluationPage result = studentEvaluationRepository.findPage(
				new StudentEvaluationFilter(studentId, classId), page, limit);
		return new StudentEvaluationPage(
				result.getContent().stream().map(this::addTeacherName).toList(),
				page,
				limit,
				result.getTotalElements());
	}

	@Transactional
	public Long createForStudent(long studentId, CreateStudentEvaluationCommand command) {
		User teacher = requireTeacher();
		if (command == null || command.classId() == null || command.content() == null) {
			throw ApiException.badRequest(INVALID_REQUEST_MESSAGE);
		}
		if (command.content().isBlank()) {
			throw ApiException.badRequest(EMPTY_CONTENT_MESSAGE);
		}

		EnglishClass englishClass = classRepository.findById(command.classId()).orElse(null);
		if (englishClass == null || !classRepository.studentExists(studentId)) {
			throw ApiException.notFound(STUDENT_OR_CLASS_NOT_FOUND_MESSAGE);
		}
		if (!Objects.equals(englishClass.getTeacherId(), teacher.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		if (!classMemberRepository.existsByClassIdAndStudentId(command.classId(), studentId)) {
			throw ApiException.badRequest(STUDENT_NOT_IN_CLASS_MESSAGE);
		}

		StudentEvaluation evaluation = new StudentEvaluation(
				null,
				studentId,
				teacher.id(),
				command.classId(),
				teacher.fullName(),
				command.content(),
				null);
		return studentEvaluationRepository.save(evaluation).id();
	}

	@Transactional(readOnly = true)
	public StudentEvaluation getById(long evaluationId) {
		User caller = requireReader();
		StudentEvaluation evaluation = requireEvaluation(evaluationId);
		if (caller.role() == UserRole.STUDENT && !Objects.equals(caller.id(), evaluation.studentId())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return evaluation;
	}

	@Transactional
	public void update(long evaluationId, UpdateStudentEvaluationCommand command) {
		User teacher = requireTeacher();
		if (command == null || command.content() == null || command.content().isBlank()) {
			throw ApiException.badRequest(EMPTY_CONTENT_MESSAGE);
		}
		StudentEvaluation current = requireEvaluation(evaluationId);
		requireAuthor(current, teacher);
		studentEvaluationRepository.save(current.withContent(command.content()));
	}

	@Transactional
	public void delete(long evaluationId) {
		User teacher = requireTeacher();
		StudentEvaluation evaluation = requireEvaluation(evaluationId);
		requireAuthor(evaluation, teacher);
		studentEvaluationRepository.deleteById(evaluation.id());
	}

	private StudentEvaluation addTeacherName(StudentEvaluation evaluation) {
		String teacherName = classRepository.findTeacher(evaluation.teacherId())
				.map(TeacherInfo::fullName)
				.orElse(null);
		return evaluation.withTeacherName(teacherName);
	}

	private User requireReader() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER && caller.role() != UserRole.STUDENT) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private User requireTeacher() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private void requireAuthor(StudentEvaluation evaluation, User teacher) {
		if (!Objects.equals(evaluation.teacherId(), teacher.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private StudentEvaluation requireEvaluation(long evaluationId) {
		return studentEvaluationRepository.findById(evaluationId)
				.orElseThrow(() -> ApiException.notFound(EVALUATION_NOT_FOUND_MESSAGE));
	}

	private void validatePage(long studentId, Long classId, int page, int limit) {
		if (studentId <= 0 || (classId != null && classId <= 0) || page < 1 || limit < 1 || limit > 100) {
			throw ApiException.badRequest(INVALID_PAGE_MESSAGE);
		}
	}
}
