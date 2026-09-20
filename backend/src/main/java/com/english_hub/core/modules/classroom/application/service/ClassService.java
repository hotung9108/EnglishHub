package com.english_hub.core.modules.classroom.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.modules.classroom.application.command.CreateClassCommand;
import com.english_hub.core.modules.classroom.application.command.UpdateClassCommand;
import com.english_hub.core.modules.classroom.application.page.ClassPageRequest;
import com.english_hub.core.modules.classroom.domain.model.ClassPage;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClassService {

	private static final String CLASS_NOT_FOUND_MESSAGE = "Không tìm thấy lớp học.";
	private static final String INVALID_STATUS_MESSAGE = "status không hợp lệ.";
	private static final String INVALID_PARAM_MESSAGE = "Dữ liệu không hợp lệ.";
	private static final String MISSING_NAME_OR_START_DATE_MESSAGE = "Vui lòng nhập đầy đủ tên lớp và ngày bắt đầu.";
	private static final String INVALID_DATE_RANGE_MESSAGE = "Ngày kết thúc phải sau ngày bắt đầu.";
	private static final String TEACHER_NOT_FOUND_MESSAGE = "Không tìm thấy giáo viên (teacherId không tồn tại).";
	private static final String NO_DATA_TO_UPDATE_MESSAGE = "Không có dữ liệu để cập nhật.";
	private static final String INVALID_UPDATE_STATUS_MESSAGE =
			"status phải là ACTIVE, INACTIVE, COMPLETED hoặc CANCELLED.";
	private static final String DELETE_BLOCKED_MESSAGE =
			"Không thể xoá: lớp học vẫn còn dữ liệu liên quan.";
	private static final int NAME_MAX_LENGTH = 150;
	private static final int LEVEL_MAX_LENGTH = 50;

	private final ClassRepository classRepository;
	private final ClassMemberRepository classMemberRepository;
	private final CurrentUserProvider currentUserProvider;

	public ClassService(
			ClassRepository classRepository,
			ClassMemberRepository classMemberRepository,
			CurrentUserProvider currentUserProvider) {
		this.classRepository = classRepository;
		this.classMemberRepository = classMemberRepository;
		this.currentUserProvider = currentUserProvider;
	}

	@Transactional(readOnly = true)
	public ClassPage listClasses(String statusValue, int page, int limit) {
		ClassPageRequest pageRequest = new ClassPageRequest(page, limit);
		if (!pageRequest.isValid()) {
			throw ApiException.badRequest(INVALID_PARAM_MESSAGE);
		}
		User caller = currentUserProvider.requireActiveUser();
		return classRepository.findPage(
				parseStatusFilter(statusValue),
				caller.role(),
				caller.id(),
				pageRequest);
	}

	@Transactional(readOnly = true)
	public ClassDetailResult getClassDetail(long classId) {
		EnglishClass englishClass = classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
		TeacherInfo teacher = englishClass.getTeacherId() == null
				? null
				: classRepository.findTeacher(englishClass.getTeacherId()).orElse(null);
		long memberCount = classMemberRepository.countByClassId(classId);
		return new ClassDetailResult(englishClass, teacher, memberCount);
	}

	private ClassStatus parseStatusFilter(String statusValue) {
		if (statusValue == null || statusValue.isBlank()) {
			return null;
		}
		try {
			return ClassStatus.valueOf(statusValue);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest(INVALID_STATUS_MESSAGE);
		}
	}

	@Transactional
	public long createClass(CreateClassCommand command) {
		if (command == null
				|| !hasText(command.name())
				|| command.startDate() == null) {
			throw ApiException.badRequest(MISSING_NAME_OR_START_DATE_MESSAGE);
		}
		String name = command.name().trim();
		if (name.length() > NAME_MAX_LENGTH
				|| (command.level() != null && command.level().trim().length() > LEVEL_MAX_LENGTH)) {
			throw ApiException.badRequest(INVALID_PARAM_MESSAGE);
		}
		validateDateRange(command.startDate(), command.endDate());
		validateTeacherExists(command.teacherId());
		EnglishClass englishClass = new EnglishClass(
				name,
				trimToNull(command.level()),
				trimToNull(command.description()),
				command.startDate(),
				command.endDate(),
				ClassStatus.ACTIVE,
				command.teacherId());
		return classRepository.save(englishClass).getId();
	}

	@Transactional
	public void updateClass(long classId, UpdateClassCommand command) {
		EnglishClass englishClass = classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
		if (command == null || hasNoUpdateFields(command)) {
			throw ApiException.badRequest(NO_DATA_TO_UPDATE_MESSAGE);
		}
		ClassStatus newStatus = parseUpdateStatus(command.status());
		validateDateRange(englishClass.getStartDate(), command.endDate());
		validateTeacherExists(command.teacherId());
		if (command.name() != null) {
			String name = command.name().trim();
			if (name.isEmpty() || name.length() > NAME_MAX_LENGTH) {
				throw ApiException.badRequest(INVALID_PARAM_MESSAGE);
			}
			englishClass.setName(name);
		}
		if (command.level() != null) {
			String level = command.level().trim();
			if (level.length() > LEVEL_MAX_LENGTH) {
				throw ApiException.badRequest(INVALID_PARAM_MESSAGE);
			}
			englishClass.setLevel(level.isEmpty() ? null : level);
		}
		if (command.description() != null) {
			englishClass.setDescription(command.description());
		}
		if (command.endDate() != null) {
			englishClass.setEndDate(command.endDate());
		}
		if (newStatus != null) {
			englishClass.setStatus(newStatus);
		}
		if (command.teacherId() != null) {
			englishClass.setTeacherId(command.teacherId());
		}
		classRepository.save(englishClass);
	}

	@Transactional
	public void deleteClass(long classId) {
		EnglishClass englishClass = classRepository.findById(classId)
				.orElseThrow(() -> ApiException.notFound(CLASS_NOT_FOUND_MESSAGE));
		if (classRepository.hasRelatedData(classId)) {
			throw ApiException.conflict(DELETE_BLOCKED_MESSAGE);
		}
		classRepository.deleteById(englishClass.getId());
	}

	private boolean hasNoUpdateFields(UpdateClassCommand command) {
		return command.name() == null
				&& command.level() == null
				&& command.description() == null
				&& command.endDate() == null
				&& command.status() == null
				&& command.teacherId() == null;
	}

	private ClassStatus parseUpdateStatus(String statusValue) {
		if (statusValue == null || statusValue.isBlank()) {
			return null;
		}
		try {
			return ClassStatus.valueOf(statusValue);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest(INVALID_UPDATE_STATUS_MESSAGE);
		}
	}

	private void validateDateRange(LocalDate startDate, LocalDate endDate) {
		if (endDate != null && endDate.isBefore(startDate)) {
			throw ApiException.badRequest(INVALID_DATE_RANGE_MESSAGE);
		}
	}

	private void validateTeacherExists(Long teacherId) {
		if (teacherId != null && !classRepository.teacherExists(teacherId)) {
			throw ApiException.notFound(TEACHER_NOT_FOUND_MESSAGE);
		}
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

	public record ClassDetailResult(EnglishClass englishClass, TeacherInfo teacher, long memberCount) {
	}
}