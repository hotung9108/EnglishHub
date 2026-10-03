package com.english_hub.core.modules.report.infrastructure.adapter;

import com.english_hub.core.modules.report.domain.model.ReportAssignmentCompletionCount;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentCount;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentRow;
import com.english_hub.core.modules.report.domain.model.ReportClassPage;
import com.english_hub.core.modules.report.domain.model.ReportMemberCount;
import com.english_hub.core.modules.report.domain.model.ReportMemberRow;
import com.english_hub.core.modules.report.domain.model.ReportPendingByStatus;
import com.english_hub.core.modules.report.domain.model.ReportStudentCompletion;
import com.english_hub.core.modules.report.domain.model.ReportStudentAttemptScore;
import com.english_hub.core.modules.report.domain.model.ReportStudentIdentity;
import com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore;
import com.english_hub.core.modules.report.domain.model.ReportSubmissionScore;
import com.english_hub.core.modules.report.domain.repository.ReportRepository;
import com.english_hub.core.modules.report.infrastructure.persistence.repository.ReportClassJpaRepository;
import com.english_hub.core.modules.report.infrastructure.persistence.repository.ReportMetricsJpaRepository;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.common.domain.UserRole;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional(readOnly = true)
public class ReportJpaAdapter implements ReportRepository {

	private static final List<AssignmentStatus> ASSIGNMENT_STATUSES =
			List.of(AssignmentStatus.PUBLISHED, AssignmentStatus.CLOSED);
	private static final List<SubmissionStatus> SUBMISSION_STATUSES =
			List.of(SubmissionStatus.SUBMITTED, SubmissionStatus.GRADED);
	private static final List<GradingStatus> PENDING_STATUSES =
			List.of(GradingStatus.PENDING, GradingStatus.AI_GRADED, GradingStatus.FAILED);

	private final ReportClassJpaRepository classRepository;
	private final ReportMetricsJpaRepository metricsRepository;

	public ReportJpaAdapter(
			ReportClassJpaRepository classRepository,
			ReportMetricsJpaRepository metricsRepository) {
		this.classRepository = classRepository;
		this.metricsRepository = metricsRepository;
	}

	@Override
	public boolean classExists(long classId) {
		return classRepository.existsById(classId);
	}

	@Override
	public List<Long> findClassIds(Long teacherId, Long classId) {
		return classRepository.findClassIds(teacherId, classId);
	}

	@Override
	public ReportClassPage findClassPage(Long teacherId, int page, int limit) {
		var result = classRepository.findClassPage(teacherId, PageRequest.of(page - 1, limit));
		return new ReportClassPage(result.getContent(), result.getTotalElements());
	}

	@Override
	public List<ReportAssignmentCount> countAssignments(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to) {
		return metricsRepository.countAssignments(
				classIds, ASSIGNMENT_STATUSES, from, to, from != null, to != null);
	}

	@Override
	public List<ReportMemberCount> countCurrentMembers(List<Long> classIds) {
		return metricsRepository.countCurrentMembers(classIds, UserRole.STUDENT);
	}

	@Override
	public List<ReportAssignmentCompletionCount> countCompletedMembersByAssignment(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to) {
		return metricsRepository.countCompletedMembersByAssignment(
				classIds, ASSIGNMENT_STATUSES, SUBMISSION_STATUSES, UserRole.STUDENT,
				from, to, from != null, to != null);
	}

	@Override
	public List<ReportStudentCompletion> countCompletedAssignmentsByStudent(
			long classId,
			OffsetDateTime from,
			OffsetDateTime to) {
		return metricsRepository.countCompletedAssignmentsByStudent(
				classId, ASSIGNMENT_STATUSES, SUBMISSION_STATUSES, UserRole.STUDENT,
				from, to, from != null, to != null);
	}

	@Override
	public List<ReportMemberRow> findCurrentMembers(long classId) {
		return metricsRepository.findCurrentMembers(classId, UserRole.STUDENT);
	}

	@Override
	public List<ReportAssignmentRow> findAssignments(
			long classId,
			OffsetDateTime from,
			OffsetDateTime to) {
		return metricsRepository.findAssignments(
				classId, ASSIGNMENT_STATUSES, from, to, from != null, to != null);
	}

	@Override
	public List<ReportSubmissionScore> findSubmissionScores(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to) {
		return metricsRepository.findSubmissionScores(
				classIds, SUBMISSION_STATUSES, GradingStatus.COMPLETED, UserRole.STUDENT,
				from, to, from != null, to != null);
	}

	@Override
	public List<ReportPendingByStatus> countPendingGradings(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to) {
		return metricsRepository.countPendingGradings(
				classIds, SUBMISSION_STATUSES, PENDING_STATUSES, UserRole.STUDENT,
				from, to, from != null, to != null);
	}

	@Override
	public ReportStudentIdentity findStudent(long studentId) {
		return metricsRepository.findStudent(studentId, UserRole.STUDENT);
	}

	@Override
	public List<ReportStudentAttemptScore> findStudentAttemptScores(
			long studentId, Long classId, OffsetDateTime from, OffsetDateTime to) {
		return metricsRepository.findStudentAttemptScores(
				studentId, classId, SUBMISSION_STATUSES, GradingStatus.COMPLETED, UserRole.STUDENT,
				from, to, classId != null, from != null, to != null);
	}

	@Override
	public List<ReportStudentSkillScore> findStudentSkillScores(
			long studentId, Long classId, OffsetDateTime from, OffsetDateTime to) {
		return metricsRepository.findStudentSkillScores(
				studentId, classId, SUBMISSION_STATUSES, GradingStatus.COMPLETED, UserRole.STUDENT,
				from, to, classId != null, from != null, to != null);
	}
}
