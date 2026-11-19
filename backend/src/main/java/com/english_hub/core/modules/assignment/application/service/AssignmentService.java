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
import com.english_hub.core.modules.assignment.domain.repository.AssignmentAttemptCountRepository;
import com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassAccess;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.PessimisticLockingFailureException;
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
	private static final String CLOSE_AT_ONLY_FOR_REOPEN_MESSAGE = "Chỉ được cập nhật hạn nộp khi mở lại bài tập.";
	private static final String REOPEN_CLOSE_AT_BEFORE_OPEN_MESSAGE = "Hạn nộp phải sau thời điểm mở bài.";
	private static final String REOPEN_CLOSE_AT_NOT_FUTURE_MESSAGE = "Hạn nộp khi mở lại phải sau thời điểm hiện tại.";
	private static final String MAX_SUBMISSIONS_BELOW_ATTEMPTS_MESSAGE =
			"Số lần nộp tối đa không được nhỏ hơn số lượt đã làm cao nhất của học viên (%d lượt).";
	private static final String LOCK_TIMEOUT_MESSAGE = "Tài nguyên đang được cập nhật, vui lòng thử lại.";
	private static final int TITLE_MAX_LENGTH = 200;

	private final AssignmentRepository assignmentRepository;
	private final ClassRepository classRepository;
	private final CurrentUserProvider currentUserProvider;
	private final AssignmentAttemptCountRepository attemptCountRepository;
	private final Clock clock;

	@Autowired
	public AssignmentService(
			AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			CurrentUserProvider currentUserProvider,
			AssignmentAttemptCountRepository attemptCountRepository) {
		this(assignmentRepository, classRepository, currentUserProvider, attemptCountRepository, Clock.systemUTC());
	}

	AssignmentService(
			AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			CurrentUserProvider currentUserProvider,
			AssignmentAttemptCountRepository attemptCountRepository,
			Clock clock) {
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.currentUserProvider = currentUserProvider;
		this.attemptCountRepository = attemptCountRepository;
		this.clock = clock;
	}

	@Transactional(readOnly = true)
	public AssignmentListResult listAssignments(String statusValue, long classId, int page, int limit) {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() == UserRole.ADMIN) {
			classAccessOrThrow(classId, caller);
		} else {
			requireClassAccess(classId, caller);
		}
		AssignmentStatus status = parseStatusFilter(statusValue);
		AssignmentPageRequest pageRequest = new AssignmentPageRequest(page, limit);
		if (!pageRequest.isValid()) {
			throw ApiException.badRequest(INVALID_DATA_MESSAGE);
		}
		if (caller.role() == UserRole.STUDENT && status == AssignmentStatus.DRAFT) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		AssignmentPage assignmentPage;
		if (caller.role() == UserRole.STUDENT && status == null) {
			assignmentPage = assignmentRepository.findPageExcludingDraft(classId, pageRequest);
		} else {
			assignmentPage = assignmentRepository.findPage(classId, status, pageRequest);
		}
		if (assignmentPage.assignments().isEmpty()) {
			return new AssignmentListResult(assignmentPage, Map.of());
		}
		List<Long> assignmentIds = assignmentPage.assignments().stream().map(Assignment::id).toList();
		Map<Long, List<ModuleSkill>> skillsByAssignmentId =
				assignmentRepository.findSkillsByAssignmentIds(assignmentIds);
		return new AssignmentListResult(assignmentPage, skillsByAssignmentId);
	}

	@Transactional
	public long createAssignment(long classId, CreateAssignmentCommand command) {
		User caller = requireTeacher();
		ClassAccess access = classAccessOrThrow(classId, caller);
		if (access.teacherId() == null) {
			throw ApiException.badRequest(CLASS_WITHOUT_TEACHER_MESSAGE);
		}
		if (!Objects.equals(access.teacherId(), caller.id())) {
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
		if (caller.role() == UserRole.STUDENT && assignment.status() == AssignmentStatus.DRAFT) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return new AssignmentDetailResult(
				assignment,
				assignmentRepository.findModuleSummaries(assignment.id()));
	}

	@Transactional
	public AssignmentUpdateResult updateAssignment(
			long assignmentId,
			UpdateAssignmentCommand command) {
		User caller = requireTeacher();
		Assignment assignment = findAssignmentForUpdateOrThrow(assignmentId);
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
		validateAttemptLimit(assignment, command.maxSubmissions());

		assignment.updateDetails(title, description, openAt, closeAt, maxSubmissions);
		Assignment savedAssignment = assignmentRepository.save(assignment);
		return new AssignmentUpdateResult(savedAssignment.maxSubmissions());
	}

	private void validateAttemptLimit(Assignment assignment, Integer requestedCap) {
		Integer currentCap = assignment.maxSubmissions();
		if (requestedCap == null || (currentCap != null && requestedCap >= currentCap)) {
			return;
		}
		long highestAttemptCount = attemptCountRepository.findHighestAttemptCount(assignment.id());
		if (requestedCap < highestAttemptCount) {
			throw ApiException.badRequest(MAX_SUBMISSIONS_BELOW_ATTEMPTS_MESSAGE.formatted(highestAttemptCount));
		}
	}

	@Transactional
	public void deleteAssignment(long assignmentId) {
		User caller = requireTeacher();
		Assignment assignment = findAssignmentForUpdateOrThrow(assignmentId);
		requireTeacherOwnsClass(assignment.classId(), caller);
		assignment.softDelete();
		assignmentRepository.save(assignment);
	}

	@Transactional
	public AssignmentStatus updateStatus(long assignmentId, UpdateAssignmentStatusCommand command) {
		User caller = requireTeacher();
		Assignment assignment = findAssignmentForUpdateOrThrow(assignmentId);
		requireTeacherOwnsClass(assignment.classId(), caller);
		AssignmentStatus nextStatus = parseStatus(command == null ? null : command.status());
		boolean reopening = assignment.status() == AssignmentStatus.CLOSED && nextStatus == AssignmentStatus.PUBLISHED;
		OffsetDateTime requestedCloseAt = command.closeAt();
		if (!reopening && requestedCloseAt != null) {
			throw ApiException.badRequest(CLOSE_AT_ONLY_FOR_REOPEN_MESSAGE);
		}
		if (!assignment.canTransitionTo(nextStatus)) {
			throw ApiException.badRequest(INVALID_STATUS_TRANSITION_MESSAGE);
		}
		if (reopening) {
			validateReopenDeadline(assignment, requestedCloseAt);
			assignment.reopen(requestedCloseAt);
		} else {
			assignment.changeStatus(nextStatus);
		}
		assignmentRepository.save(assignment);
		return nextStatus;
	}

	private void validateReopenDeadline(Assignment assignment, OffsetDateTime requestedCloseAt) {
		OffsetDateTime effectiveCloseAt = requestedCloseAt == null ? assignment.closeAt() : requestedCloseAt;
		if (!effectiveCloseAt.isAfter(assignment.openAt())) {
			throw ApiException.badRequest(REOPEN_CLOSE_AT_BEFORE_OPEN_MESSAGE);
		}
		if (!effectiveCloseAt.isAfter(OffsetDateTime.now(clock))) {
			throw ApiException.badRequest(REOPEN_CLOSE_AT_NOT_FUTURE_MESSAGE);
		}
	}

	private User requireTeacher() {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		return caller;
	}

	private void requireClassAccess(long classId, User caller) {
		ClassAccess access = classAccessOrThrow(classId, caller);
		if (caller.role() == UserRole.ADMIN) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		if (caller.role() == UserRole.TEACHER && Objects.equals(access.teacherId(), caller.id())) {
			return;
		}
		if (caller.role() == UserRole.STUDENT && access.studentMember()) {
			return;
		}
		throw ApiException.forbidden(FORBIDDEN_MESSAGE);
	}

	private void requireTeacherOwnsClass(long classId, User caller) {
		ClassAccess access = classAccessOrThrow(classId, caller);
		if (!Objects.equals(access.teacherId(), caller.id())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	/**
	 * Resolves class existence, owner and caller membership in one query instead
	 * of separate class + class_member SELECTs (~40ms each on staging).
	 */
	private ClassAccess classAccessOrThrow(long classId, User caller) {
		return classRepository.findAccess(classId, caller.id())
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
	}

	private Assignment findAssignmentOrThrow(long assignmentId) {
		return assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
	}

	private Assignment findAssignmentForUpdateOrThrow(long assignmentId) {
		try {
			return assignmentRepository.findByIdForUpdate(assignmentId)
					.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
		} catch (PessimisticLockingFailureException exception) {
			throw ApiException.conflict(LOCK_TIMEOUT_MESSAGE);
		}
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

	public record AssignmentListResult(
			AssignmentPage assignmentPage,
			Map<Long, List<ModuleSkill>> skillsByAssignmentId) {

		public List<ModuleSkill> skillsFor(Long assignmentId) {
			return skillsByAssignmentId.getOrDefault(assignmentId, List.of());
		}
	}

	public record AssignmentDetailResult(
			Assignment assignment,
			List<AssignmentModuleSummary> modules) {
	}

	public record AssignmentUpdateResult(Integer maxSubmissions) {
	}
}
