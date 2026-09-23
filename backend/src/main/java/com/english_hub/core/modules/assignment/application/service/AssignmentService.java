package com.english_hub.core.modules.assignment.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.assignment.application.command.CreateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentStatusCommand;
import com.english_hub.core.modules.assignment.application.page.AssignmentPageRequest;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AssignmentService {

	private static final String ASSIGNMENT_NOT_FOUND_MESSAGE = "Không tìm thấy bài tập.";
	private static final String CLASS_NOT_FOUND_MESSAGE = "Không tìm thấy lớp học.";
	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String INVALID_DATA_MESSAGE = "Dữ liệu không hợp lệ.";
	private static final String INVALID_STATUS_FILTER_MESSAGE = "status không hợp lệ.";
	private static final String INVALID_TIME_OR_SUBMISSIONS_MESSAGE =
			"Dữ liệu thời gian hoặc số lần nộp không hợp lệ.";
	private static final String CLASS_WITHOUT_TEACHER_MESSAGE =
			"Lớp học chưa được gán giáo viên phụ trách, không thể tạo bài tập.";
	private static final String CLOSED_ASSIGNMENT_MESSAGE = "Không thể sửa bài tập đã đóng.";
	private static final String INVALID_STATUS_TRANSITION_MESSAGE = "Không thể chuyển sang trạng thái này.";
	private static final int TITLE_MAX_LENGTH = 200;

	private final AssignmentRepository assignmentRepository;
	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;

	public AssignmentService(
			AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider) {
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
	}

	@Transactional(readOnly = true)
	public AssignmentPage listAssignments(String statusValue, long classId, int page, int limit) {
		User caller = currentUserProvider.requireActiveUser();
		requireClassAccess(classId, caller);
		AssignmentStatus status = parseStatusFilter(statusValue);
		AssignmentPageRequest pageRequest = new AssignmentPageRequest(page, limit);
		if (!pageRequest.isValid()) {
			throw ApiException.badRequest(INVALID_DATA_MESSAGE);
		}
		return assignmentRepository.findPage(classId, status, pageRequest);
	}

	@Transactional
	public long createAssignment(long classId, CreateAssignmentCommand command) {
		User caller = requireTeacher();
		EnglishClass englishClass = requireClass(classId);
		if (englishClass.getTeacherId() == null) {
			throw ApiException.badRequest(CLASS_WITHOUT_TEACHER_MESSAGE);
		}
		if (!Objects.equals(englishClass.getTeacherId(), caller.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		validateCreateCommand(command);

		Assignment assignment = Assignment.create(
				classId,
				normalizeTitle(command.title()),
				trimToNull(command.description()),
				command.openAt(),
				command.closeAt(),
				command.maxSubmissions());
		return assignmentRepository.save(assignment).id();
	}

	@Transactional(readOnly = true)
	public AssignmentDetailResult getAssignmentDetail(long assignmentId) {
		User caller = currentUserProvider.requireActiveUser();
		Assignment assignment = findAssignmentOrThrow(assignmentId);
		requireClassAccess(assignment.classId(), caller);
		return new AssignmentDetailResult(
				assignment,
				assignmentRepository.findModuleSummaries(assignment.id()));
	}

	@Transactional
	public void updateAssignment(long assignmentId, UpdateAssignmentCommand command) {
		User caller = requireTeacher();
		Assignment assignment = findAssignmentOrThrow(assignmentId);
		requireTeacherOwnsClass(assignment.classId(), caller);
		if (assignment.status() == AssignmentStatus.CLOSED) {
			throw ApiException.badRequest(CLOSED_ASSIGNMENT_MESSAGE);
		}
		if (command == null || hasNoUpdateFields(command)) {
			throw ApiException.badRequest(INVALID_DATA_MESSAGE);
		}

		String title = command.title() == null ? assignment.title() : normalizeTitle(command.title());
		String description = command.description() == null
				? assignment.description()
				: trimToNull(command.description());
		OffsetDateTime openAt = command.openAt() == null ? assignment.openAt() : command.openAt();
		OffsetDateTime closeAt = command.closeAt() == null ? assignment.closeAt() : command.closeAt();
		Integer maxSubmissions = command.maxSubmissions() == null
				? assignment.maxSubmissions()
				: command.maxSubmissions();
		validateTitle(title, false);
		validateTimeAndSubmissions(openAt, closeAt, maxSubmissions);

		assignment.updateDetails(title, description, openAt, closeAt, maxSubmissions);
		assignmentRepository.save(assignment);
	}

	@Transactional
	public void deleteAssignment(long assignmentId) {
		User caller = requireTeacher();
		Assignment assignment = findAssignmentOrThrow(assignmentId);
		requireTeacherOwnsClass(assignment.classId(), caller);
		assignment.softDelete();
		assignmentRepository.save(assignment);
	}

	@Transactional
	public AssignmentStatus updateStatus(long assignmentId, UpdateAssignmentStatusCommand command) {
		User caller = requireTeacher();
		Assignment assignment = findAssignmentOrThrow(assignmentId);
		requireTeacherOwnsClass(assignment.classId(), caller);
		AssignmentStatus nextStatus = parseStatus(command == null ? null : command.status());
		if (!assignment.canTransitionTo(nextStatus)) {
			throw ApiException.badRequest(INVALID_STATUS_TRANSITION_MESSAGE);
		}
		assignment.changeStatus(nextStatus);
		assignmentRepository.save(assignment);
		return nextStatus;
	}

	private User requireTeacher() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private EnglishClass requireClassAccess(long classId, User caller) {
		EnglishClass englishClass = requireClass(classId);
		if (caller.role() == UserRole.ADMIN) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		if (caller.role() == UserRole.TEACHER
				&& Objects.equals(englishClass.getTeacherId(), caller.id())) {
			return englishClass;
		}
		if (caller.role() == UserRole.STUDENT
				&& classMemberRepository.existsByClassIdAndStudentId(classId, caller.id())) {
			return englishClass;
		}
		throw ApiException.forbidden(FORBIDDEN_MESSAGE);
	}

	private void requireTeacherOwnsClass(long classId, User caller) {
		EnglishClass englishClass = requireClass(classId);
		if (!Objects.equals(englishClass.getTeacherId(), caller.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private EnglishClass requireClass(long classId) {
		return classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
	}

	private Assignment findAssignmentOrThrow(long assignmentId) {
		return assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
	}

	private AssignmentStatus parseStatusFilter(String statusValue) {
		if (statusValue == null || statusValue.isBlank()) {
			return null;
		}
		try {
			return AssignmentStatus.fromApiValue(statusValue);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest(INVALID_STATUS_FILTER_MESSAGE);
		}
	}

	private AssignmentStatus parseStatus(String statusValue) {
		try {
			return AssignmentStatus.fromApiValue(statusValue);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest(INVALID_STATUS_TRANSITION_MESSAGE);
		}
	}

	private void validateCreateCommand(CreateAssignmentCommand command) {
		if (command == null) {
			throw ApiException.badRequest(INVALID_DATA_MESSAGE);
		}
		validateTitle(command.title(), true);
		validateTimeAndSubmissions(command.openAt(), command.closeAt(), command.maxSubmissions());
	}

	private void validateTitle(String title, boolean required) {
		if (required && !hasText(title)) {
			throw ApiException.badRequest(INVALID_DATA_MESSAGE);
		}
		if (title != null && (!hasText(title) || title.trim().length() > TITLE_MAX_LENGTH)) {
			throw ApiException.badRequest(INVALID_DATA_MESSAGE);
		}
	}

	private void validateTimeAndSubmissions(
			OffsetDateTime openAt,
			OffsetDateTime closeAt,
			Integer maxSubmissions) {
		if (openAt == null
				|| closeAt == null
				|| !openAt.isBefore(closeAt)
				|| (maxSubmissions != null && maxSubmissions <= 0)) {
			throw ApiException.badRequest(INVALID_TIME_OR_SUBMISSIONS_MESSAGE);
		}
	}

	private boolean hasNoUpdateFields(UpdateAssignmentCommand command) {
		return command.title() == null
				&& command.description() == null
				&& command.openAt() == null
				&& command.closeAt() == null
				&& command.maxSubmissions() == null;
	}

	private String normalizeTitle(String title) {
		validateTitle(title, true);
		return title.trim();
	}

	private boolean hasText(String value) {
		return value != null && !value.isBlank();
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

	public record AssignmentDetailResult(
			Assignment assignment,
			List<AssignmentModuleSummary> modules) {
	}
}
