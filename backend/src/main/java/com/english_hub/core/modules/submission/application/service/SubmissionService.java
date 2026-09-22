package com.english_hub.core.modules.submission.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.submission.application.page.SubmissionPageRequest;
import com.english_hub.core.modules.submission.domain.model.AssignmentStatus;
import com.english_hub.core.modules.submission.domain.model.AssignmentWindow;
import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.model.ModuleInfo;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionFilter;
import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionPage;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.AssignmentModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.AssignmentWindowRepository;
import com.english_hub.core.modules.submission.domain.repository.ClassTeachingRepository;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.domain.repository.StudentClassEnrollmentRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SubmissionService {

	private static final String FORBIDDEN_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
	private static final String ASSIGNMENT_NOT_FOUND_MESSAGE = "Không tìm thấy bài tập.";
	private static final String CANNOT_START_MESSAGE = "Không thể bắt đầu làm bài tập này lúc này.";
	private static final String SUBMISSION_NOT_FOUND_MESSAGE = "Không tìm thấy lượt làm bài.";
	private static final String INVALID_PARAM_MESSAGE = "Dữ liệu không hợp lệ.";
	private static final String INVALID_STATUS_MESSAGE = "status không hợp lệ.";
	private static final String TEACHER_ASSIGNMENT_REQUIRED_MESSAGE = "assignmentId là bắt buộc đối với giáo viên.";

	private final SubmissionRepository submissionRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final GradingRepository gradingRepository;
	private final AssignmentWindowRepository assignmentWindowRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final StudentClassEnrollmentRepository studentClassEnrollmentRepository;
	private final ClassTeachingRepository classTeachingRepository;
	private final CurrentUserProvider currentUserProvider;

	public SubmissionService(
			SubmissionRepository submissionRepository,
			SubmissionModuleRepository submissionModuleRepository,
			GradingRepository gradingRepository,
			AssignmentWindowRepository assignmentWindowRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			StudentClassEnrollmentRepository studentClassEnrollmentRepository,
			ClassTeachingRepository classTeachingRepository,
			CurrentUserProvider currentUserProvider) {
		this.submissionRepository = submissionRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.gradingRepository = gradingRepository;
		this.assignmentWindowRepository = assignmentWindowRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.studentClassEnrollmentRepository = studentClassEnrollmentRepository;
		this.classTeachingRepository = classTeachingRepository;
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

	@Transactional(readOnly = true)
	public SubmissionDetailResult getById(long submissionId) {
		User caller = currentUserProvider.requireActiveUser();
		Submission submission = submissionRepository.findById(submissionId)
				.orElseThrow(() -> ApiException.notFound(SUBMISSION_NOT_FOUND_MESSAGE));
		verifyReadAccess(submission, caller);
		return composeDetail(submission);
	}

	@Transactional(readOnly = true)
	public SubmissionListResult list(
			Long assignmentId, Long studentId, String statusValue, int page, int limit) {
		SubmissionPageRequest pageRequest = new SubmissionPageRequest(page, limit);
		if (!pageRequest.isValid()) {
			throw ApiException.badRequest(INVALID_PARAM_MESSAGE);
		}
		User caller = currentUserProvider.requireActiveUser();
		SubmissionStatus status = parseStatusFilter(statusValue);
		Long scopedStudentId = studentId;
		switch (caller.role()) {
			case ADMIN -> {
				// filters are used as provided
			}
			case STUDENT -> {
				if (studentId != null && !studentId.equals(caller.id())) {
					throw ApiException.forbidden(FORBIDDEN_MESSAGE);
				}
				scopedStudentId = caller.id();
			}
			case TEACHER -> {
				if (assignmentId == null) {
					throw ApiException.badRequest(TEACHER_ASSIGNMENT_REQUIRED_MESSAGE);
				}
				if (!isTeacherOfAssignment(caller.id(), assignmentId)) {
					throw ApiException.forbidden(FORBIDDEN_MESSAGE);
				}
			}
			default -> throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
		SubmissionPage result = submissionRepository.findPage(
				new SubmissionFilter(assignmentId, scopedStudentId, status), pageRequest);
		return composeList(result);
	}

	private void verifyReadAccess(Submission submission, User caller) {
		switch (caller.role()) {
			case ADMIN -> {
				// admin sees any submission
			}
			case STUDENT -> {
				if (!submission.getStudentId().equals(caller.id())) {
					throw ApiException.forbidden(FORBIDDEN_MESSAGE);
				}
			}
			case TEACHER -> {
				if (!isTeacherOfAssignment(caller.id(), submission.getAssignmentId())) {
					throw ApiException.forbidden(FORBIDDEN_MESSAGE);
				}
			}
			default -> throw ApiException.forbidden(FORBIDDEN_MESSAGE);
		}
	}

	private boolean isTeacherOfAssignment(Long teacherId, Long assignmentId) {
		return assignmentWindowRepository.findWindowById(assignmentId)
				.map(window -> classTeachingRepository.isTeacherOfClass(teacherId, window.classId()))
				.orElse(false);
	}

	private SubmissionDetailResult composeDetail(Submission submission) {
		List<SubmissionModule> submissionModules =
				submissionModuleRepository.findBySubmissionIds(List.of(submission.getId()));
		Map<Long, ModuleInfo> moduleById = modulesOf(submission.getAssignmentId());
		List<Long> submissionModuleIds = submissionModules.stream().map(SubmissionModule::getId).toList();
		Map<Long, Grading> gradingBySubmissionModuleId = gradingRepository
				.findBySubmissionModuleIds(submissionModuleIds)
				.stream()
				.collect(Collectors.toMap(Grading::getSubmissionModuleId, Function.identity()));
		List<ModuleDetailResult> modules = submissionModules.stream()
				.sorted(moduleOrder(moduleById))
				.map(submissionModule -> toModuleDetail(
						submissionModule,
						moduleById.get(submissionModule.getModuleId()),
						gradingBySubmissionModuleId.get(submissionModule.getId())))
				.toList();
		return new SubmissionDetailResult(
				submission.getId(),
				submission.getAssignmentId(),
				submission.getStudentId(),
				submission.getAttemptNumber(),
				submission.getStatus(),
				submission.getSubmittedAt(),
				submission.getCreatedAt(),
				modules);
	}

	private SubmissionListResult composeList(SubmissionPage page) {
		List<Submission> submissions = page.submissions();
		if (submissions.isEmpty()) {
			return new SubmissionListResult(page.page(), page.limit(), page.total(), List.of());
		}
		List<Long> submissionIds = submissions.stream().map(Submission::getId).toList();
		List<SubmissionModule> submissionModules = submissionModuleRepository.findBySubmissionIds(submissionIds);
		Map<Long, List<SubmissionModule>> modulesBySubmissionId = submissionModules.stream()
				.collect(Collectors.groupingBy(SubmissionModule::getSubmissionId));
		List<Long> submissionModuleIds = submissionModules.stream().map(SubmissionModule::getId).toList();
		Map<Long, Grading> gradingBySubmissionModuleId = gradingRepository
				.findBySubmissionModuleIds(submissionModuleIds)
				.stream()
				.collect(Collectors.toMap(Grading::getSubmissionModuleId, Function.identity()));
		Map<Long, Map<Long, ModuleInfo>> moduleInfoByAssignment = submissions.stream()
				.map(Submission::getAssignmentId)
				.distinct()
				.collect(Collectors.toMap(Function.identity(), this::modulesOf));
		List<SubmissionListItemResult> items = submissions.stream()
				.map(submission -> toListItem(
						submission,
						modulesBySubmissionId.getOrDefault(submission.getId(), List.of()),
						moduleInfoByAssignment.get(submission.getAssignmentId()),
						gradingBySubmissionModuleId))
				.toList();
		return new SubmissionListResult(page.page(), page.limit(), page.total(), items);
	}

	private ModuleDetailResult toModuleDetail(
			SubmissionModule submissionModule, ModuleInfo moduleInfo, Grading grading) {
		return new ModuleDetailResult(
				submissionModule.getId(),
				submissionModule.getModuleId(),
				moduleInfo == null ? null : moduleInfo.skill(),
				moduleInfo == null ? null : moduleInfo.taskType(),
				submissionModule.getStatus(),
				grading == null ? null : new GradingDetailResult(
						grading.getId(),
						grading.getMethod(),
						grading.getStatus(),
						grading.getFinalScore(),
						grading.getMaxScoreSnapshot(),
						grading.getAiFeedback(),
						grading.getFinalFeedback()));
	}

	private SubmissionListItemResult toListItem(
			Submission submission,
			List<SubmissionModule> submissionModules,
			Map<Long, ModuleInfo> moduleById,
			Map<Long, Grading> gradingBySubmissionModuleId) {
		List<ModuleSummaryResult> modules = submissionModules.stream()
				.sorted(moduleOrder(moduleById))
				.map(submissionModule -> {
					ModuleInfo moduleInfo = moduleById.get(submissionModule.getModuleId());
					Grading grading = gradingBySubmissionModuleId.get(submissionModule.getId());
					return new ModuleSummaryResult(
							submissionModule.getId(),
							submissionModule.getModuleId(),
							moduleInfo == null ? null : moduleInfo.skill(),
							moduleInfo == null ? null : moduleInfo.taskType(),
							submissionModule.getStatus(),
							grading == null ? null : new GradingSummaryResult(
									grading.getFinalScore(),
									grading.getMaxScoreSnapshot(),
									grading.getStatus()));
				})
				.toList();
		return new SubmissionListItemResult(
				submission.getId(),
				submission.getStudentId(),
				submission.getAttemptNumber(),
				submission.getStatus(),
				submission.getSubmittedAt(),
				modules);
	}

	private Map<Long, ModuleInfo> modulesOf(Long assignmentId) {
		return assignmentModuleRepository.findModulesByAssignmentId(assignmentId).stream()
				.collect(Collectors.toMap(ModuleInfo::moduleId, Function.identity()));
	}

	private Comparator<SubmissionModule> moduleOrder(Map<Long, ModuleInfo> moduleById) {
		return Comparator.comparingInt(submissionModule -> Optional.ofNullable(moduleById)
				.map(byId -> byId.get(submissionModule.getModuleId()))
				.map(ModuleInfo::orderIndex)
				.orElse(Integer.MAX_VALUE));
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

	private SubmissionStatus parseStatusFilter(String statusValue) {
		if (statusValue == null || statusValue.isBlank()) {
			return null;
		}
		try {
			return SubmissionStatus.valueOf(statusValue);
		} catch (IllegalArgumentException exception) {
			throw ApiException.badRequest(INVALID_STATUS_MESSAGE);
		}
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

	public record SubmissionDetailResult(
			Long id,
			Long assignmentId,
			Long studentId,
			int attemptNumber,
			SubmissionStatus status,
			OffsetDateTime submittedAt,
			Instant createdAt,
			List<ModuleDetailResult> modules) {
	}

	public record ModuleDetailResult(
			Long submissionModuleId,
			Long moduleId,
			ModuleSkill skill,
			ModuleTaskType taskType,
			SubmissionStatus status,
			GradingDetailResult grading) {
	}

	public record GradingDetailResult(
			Long id,
			GradingMethod method,
			GradingStatus status,
			BigDecimal finalScore,
			BigDecimal maxScoreSnapshot,
			String aiFeedback,
			String finalFeedback) {
	}

	public record SubmissionListResult(
			int page,
			int limit,
			long total,
			List<SubmissionListItemResult> data) {
	}

	public record SubmissionListItemResult(
			Long id,
			Long studentId,
			int attemptNumber,
			SubmissionStatus status,
			OffsetDateTime submittedAt,
			List<ModuleSummaryResult> modules) {
	}

	public record ModuleSummaryResult(
			Long submissionModuleId,
			Long moduleId,
			ModuleSkill skill,
			ModuleTaskType taskType,
			SubmissionStatus status,
			GradingSummaryResult grading) {
	}

	public record GradingSummaryResult(
			BigDecimal finalScore,
			BigDecimal maxScoreSnapshot,
			GradingStatus status) {
	}
}