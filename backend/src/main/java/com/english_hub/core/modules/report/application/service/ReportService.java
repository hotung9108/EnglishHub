package com.english_hub.core.modules.report.application.service;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.report.application.model.ReportClassListResponse;
import com.english_hub.core.modules.report.application.model.ReportClassProgressResponse;
import com.english_hub.core.modules.report.application.model.ReportCompletionRows;
import com.english_hub.core.modules.report.application.model.ReportDateWindow;
import com.english_hub.core.modules.report.application.model.ReportOverviewResponse;
import com.english_hub.core.modules.report.application.model.ReportStudentProgressResponse;
import com.english_hub.core.modules.report.domain.model.ReportClassPage;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentRow;
import com.english_hub.core.modules.report.domain.model.ReportMemberRow;
import com.english_hub.core.modules.report.domain.model.ReportPendingByStatus;
import com.english_hub.core.modules.report.domain.model.ReportStudentCompletion;
import com.english_hub.core.modules.report.domain.model.ReportStudentAttemptScore;
import com.english_hub.core.modules.report.domain.model.ReportStudentIdentity;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import com.english_hub.core.modules.report.domain.repository.ReportRepository;
import com.english_hub.core.modules.submission.domain.repository.ClassTeachingRepository;
import com.english_hub.core.modules.user.application.port.CurrentUserProvider;
import com.english_hub.core.modules.user.domain.model.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportService {
	public static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
	private static final String FORBIDDEN = "Bạn không có quyền xem báo cáo này.";

	private final ReportRepository reports;
	private final CurrentUserProvider currentUserProvider;
	private final ClassTeachingRepository classTeachingRepository;
	private final ReportCalculator calculator;
	private final ReportResponseBuilder responseBuilder;

	public ReportService(
			ReportRepository reports,
			CurrentUserProvider currentUserProvider,
			ClassTeachingRepository classTeachingRepository,
			ReportCalculator calculator,
			ReportResponseBuilder responseBuilder) {
		this.reports = reports;
		this.currentUserProvider = currentUserProvider;
		this.classTeachingRepository = classTeachingRepository;
		this.calculator = calculator;
		this.responseBuilder = responseBuilder;
	}

	public ReportOverviewResponse overview(LocalDate from, LocalDate to, Long classId, Long teacherId) {
		validateDates(from, to);
		if (classId != null) {
			requireClass(classId);
		}
		User user = currentUserProvider.requireActiveUser();
		Long scopedTeacherId = resolveTeacherId(user, teacherId);
		checkClassAccess(user, classId);
		ReportDateWindow window = dateWindow(from, to);
		List<Long> classIds = reports.findClassIds(scopedTeacherId, classId);
		ReportCompletionRows completion = loadCompletionRows(classIds, window);
		return responseBuilder.overview(classIds.size(), classIds, completion,
				bestScores(classIds, window), pendingRows(classIds, window));
	}

	public ReportClassListResponse classes(
			LocalDate from, LocalDate to, Long teacherId, int page, int limit) {
		validateDates(from, to);
		validatePage(page, limit);
		User user = currentUserProvider.requireActiveUser();
		Long scopedTeacherId = resolveTeacherId(user, teacherId);
		ReportDateWindow window = dateWindow(from, to);
		ReportClassPage classPage = reports.findClassPage(scopedTeacherId, page, limit);
		List<Long> classIds = classPage.classes().stream().map(row -> row.classId()).toList();
		ReportCompletionRows completion = loadCompletionRows(classIds, window);
		return responseBuilder.classes(classPage, page, limit, completion, bestScores(classIds, window));
	}

	public ReportClassProgressResponse classProgress(
			long classId, LocalDate from, LocalDate to, BigDecimal threshold) {
		validateDates(from, to);
		validateThreshold(threshold);
		requireClass(classId);
		User user = currentUserProvider.requireActiveUser();
		requireReportRole(user);
		checkClassAccess(user, classId);
		ReportDateWindow window = dateWindow(from, to);
		Long scopedTeacherId = user.role() == UserRole.TEACHER ? user.id() : null;
		List<Long> classIds = reports.findClassIds(scopedTeacherId, classId);
		if (classIds.isEmpty()) {
			return responseBuilder.classProgress(classId, threshold, emptyCompletionRows(),
					List.of(), List.of(), Map.of(), List.of());
		}
		ReportCompletionRows completion = loadCompletionRows(classIds, window);
		List<ReportMemberRow> members = reports.findCurrentMembers(classId);
		List<ReportAssignmentRow> assignments = reports.findAssignments(classId, window.from(), window.to());
		return responseBuilder.classProgress(classId, threshold, completion, members, assignments,
				completedByStudent(classId, window), bestScores(classIds, window));
	}

	public ReportStudentProgressResponse studentProgress(
			long studentId, Long classId, LocalDate from, LocalDate to) {
		validateDates(from, to);
		ReportStudentIdentity student = reports.findStudent(studentId);
		if (student == null) {
			throw ApiException.notFound("Không tìm thấy học viên.");
		}
		if (classId != null) {
			requireClass(classId);
		}
		User user = currentUserProvider.requireActiveUser();
		requireReportRole(user);
		if (user.role() == UserRole.TEACHER && classId == null) {
			throw ApiException.badRequest("Giáo viên phải truyền classId.");
		}
		checkClassAccess(user, classId);
		ReportDateWindow window = dateWindow(from, to);
		List<ReportStudentAttemptScore> attemptRows = reports.findStudentAttemptScores(
				studentId, classId, window.from(), window.to());
		List<ReportSubmissionScore> bestAttempts = calculator.pickBestAttempts(toSubmissionScores(attemptRows));
		var skillRows = bestAttempts.isEmpty()
				? List.<com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore>of()
				: reports.findStudentSkillScores(studentId, classId, window.from(), window.to());
		return responseBuilder.studentProgress(student, classId, bestAttempts, attemptRows, skillRows);
	}

	private ReportCompletionRows loadCompletionRows(List<Long> classIds, ReportDateWindow window) {
		if (classIds.isEmpty()) {
			return emptyCompletionRows();
		}
		return new ReportCompletionRows(
				reports.countAssignments(classIds, window.from(), window.to()),
				reports.countCurrentMembers(classIds),
				reports.countCompletedMembersByAssignment(classIds, window.from(), window.to()));
	}

	private ReportCompletionRows emptyCompletionRows() {
		return new ReportCompletionRows(List.of(), List.of(), List.of());
	}

	private List<ReportSubmissionScore> toSubmissionScores(List<ReportStudentAttemptScore> rows) {
		List<ReportSubmissionScore> scores = new java.util.ArrayList<>();
		for (ReportStudentAttemptScore row : rows) {
			scores.add(new ReportSubmissionScore(row.submissionId(), row.assignmentId(), row.classId(),
					row.studentId(), row.submittedAt(), row.finalTotal(), row.maxTotal(),
					row.moduleCount(), row.completedModuleCount()));
		}
		return scores;
	}

	private List<ReportSubmissionScore> bestScores(List<Long> classIds, ReportDateWindow window) {
		if (classIds.isEmpty()) {
			return List.of();
		}
		return calculator.pickBestAttempts(
				reports.findSubmissionScores(classIds, window.from(), window.to()));
	}

	private List<ReportPendingByStatus> pendingRows(List<Long> classIds, ReportDateWindow window) {
		if (classIds.isEmpty()) {
			return List.of();
		}
		return reports.countPendingGradings(classIds, window.from(), window.to());
	}

	private Map<Long, Long> completedByStudent(long classId, ReportDateWindow window) {
		Map<Long, Long> counts = new HashMap<>();
		for (ReportStudentCompletion row : reports.countCompletedAssignmentsByStudent(
				classId, window.from(), window.to())) {
			counts.put(row.studentId(), row.completedAssignments());
		}
		return counts;
	}

	private Long resolveTeacherId(User user, Long requestedTeacherId) {
		requireReportRole(user);
		if (user.role() == UserRole.ADMIN) {
			return requestedTeacherId;
		}
		if (requestedTeacherId != null && !requestedTeacherId.equals(user.id())) {
			throw ApiException.forbidden(FORBIDDEN);
		}
		return user.id();
	}

	private void requireReportRole(User user) {
		if (user.role() != UserRole.ADMIN && user.role() != UserRole.TEACHER) {
			throw ApiException.forbidden(FORBIDDEN);
		}
	}

	private void checkClassAccess(User user, Long classId) {
		if (classId != null && user.role() == UserRole.TEACHER
				&& !classTeachingRepository.isTeacherOfClass(user.id(), classId)) {
			throw ApiException.forbidden(FORBIDDEN);
		}
	}

	private void requireClass(long classId) {
		if (!reports.classExists(classId)) {
			throw ApiException.notFound("Không tìm thấy lớp học.");
		}
	}

	private void validateDates(LocalDate from, LocalDate to) {
		if (from != null && to != null && from.isAfter(to)) {
			throw ApiException.badRequest("Ngày bắt đầu không được sau ngày kết thúc.");
		}
	}

	private void validateThreshold(BigDecimal threshold) {
		if (threshold == null || threshold.compareTo(BigDecimal.ZERO) < 0
				|| threshold.compareTo(BigDecimal.valueOf(100)) > 0) {
			throw ApiException.badRequest("threshold phải nằm trong khoảng 0 đến 100.");
		}
	}

	private void validatePage(int page, int limit) {
		if (page < 1) {
			throw ApiException.badRequest("page phải lớn hơn hoặc bằng 1.");
		}
		if (limit < 1 || limit > 100) {
			throw ApiException.badRequest("limit phải nằm trong khoảng 1 đến 100.");
		}
	}

	private ReportDateWindow dateWindow(LocalDate from, LocalDate to) {
		return new ReportDateWindow(
				from == null ? null : from.atStartOfDay(REPORT_ZONE).toOffsetDateTime(),
				to == null ? null : to.plusDays(1).atStartOfDay(REPORT_ZONE).toOffsetDateTime());
	}
}
