package com.english_hub.core.modules.submission.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.submission.domain.model.AssignmentStatus;
import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.AssignmentModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentWindowRepository;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.StudentClassEnrollmentRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubmissionService {

	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String ASSIGNMENT_NOT_FOUND_MESSAGE = "Không tìm thấy bài tập.";
	private static final String CANNOT_START_MESSAGE = "Không thể bắt đầu làm bài tập này lúc này.";

	private final SubmissionRepository submissionRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final GradingRepository gradingRepository;
	private final AssignmentWindowRepository assignmentWindowRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final StudentClassEnrollmentRepository studentClassEnrollmentRepository;
	private final CurrentUserProvider currentUserProvider;

	public SubmissionService(
			SubmissionRepository submissionRepository,
			SubmissionModuleRepository submissionModuleRepository,
			GradingRepository gradingRepository,
			AssignmentWindowRepository assignmentWindowRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			StudentClassEnrollmentRepository studentClassEnrollmentRepository,
			CurrentUserProvider currentUserProvider) {
		this.submissionRepository = submissionRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.gradingRepository = gradingRepository;
		this.assignmentWindowRepository = assignmentWindowRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.studentClassEnrollmentRepository = studentClassEnrollmentRepository;
		this.currentUserProvider = currentUserProvider;
	}

	@Transactional
	public SubmissionStartResult startAttempt(long assignmentId) {
		User caller = currentUserProvider.requireActiveUser();
		if (caller.role() != UserRole.STUDENT) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		AssignmentWindow window = assignmentWindowRepository.findWindowById(assignmentId)
				.orElseThrow(() -> ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE));
		if (window.deleted()) {
			throw ApiException.notFound(ASSIGNMENT_NOT_FOUND_MESSAGE);
		}
		if (!studentClassEnrollmentRepository.isStudentInClass(caller.id(), window.classId())) {
			throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		if (!isWithinWindow(window)) {
			throw ApiException.badRequest(CANNOT_START_MESSAGE);
		}
		long attempts = submissionRepository.countByAssignmentIdAndStudentId(assignmentId, caller.id());
		if (window.maxSubmissions() != null && attempts >= window.maxSubmissions()) {
			throw ApiException.badRequest(CANNOT_START_MESSAGE);
		}

		Submission submission = submissionRepository.create(assignmentId, caller.id(), (int) attempts + 1);
		List<ModuleInfo> modules = assignmentModuleRepository.findModulesByAssignmentId(assignmentId);
		Map<Long, ModuleInfo> moduleById = modules.stream()
				.collect(Collectors.toMap(ModuleInfo::moduleId, Function.identity()));
		List<SubmissionModule> submissionModules = submissionModuleRepository.bulkCreate(
				submission.getId(),
				modules.stream().map(ModuleInfo::moduleId).toList());
		gradingRepository.bulkCreate(submissionModules.stream()
				.map(submissionModule -> new GradingDraft(
						submissionModule.getId(),
						gradingMethodOf(moduleById.get(submissionModule.getModuleId()))))
				.toList());

		List<ModuleEntry> entries = submissionModules.stream()
				.map(submissionModule -> {
					ModuleInfo moduleInfo = moduleById.get(submissionModule.getModuleId());
					return new ModuleEntry(
							submissionModule.getId(),
							submissionModule.getModuleId(),
							moduleInfo.skill(),
							SubmissionStatus.IN_PROGRESS);
				})
				.toList();
		return new SubmissionStartResult(
				submission.getId(),
				submission.getAssignmentId(),
				submission.getAttemptNumber(),
				submission.getStatus(),
				submission.getCreatedAt(),
				entries);
	}

	private boolean isWithinWindow(AssignmentWindow window) {
		if (window.status() != AssignmentStatus.PUBLISHED) {
			return false;
		}
		OffsetDateTime now = OffsetDateTime.now();
		return !now.isBefore(window.openAt()) && !now.isAfter(window.closeAt());
	}

	private GradingMethod gradingMethodOf(ModuleInfo moduleInfo) {
		return moduleInfo.taskType() == ModuleTaskType.QUIZ
				? GradingMethod.AUTO
				: GradingMethod.TEACHER_MANUAL;
	}

	public record SubmissionStartResult(
			Long submissionId,
			Long assignmentId,
			int attemptNumber,
			SubmissionStatus status,
			Instant createdAt,
			List<ModuleEntry> modules) {
	}

	public record ModuleEntry(
			Long submissionModuleId,
			Long moduleId,
			ModuleSkill skill,
			SubmissionStatus status) {
	}
}