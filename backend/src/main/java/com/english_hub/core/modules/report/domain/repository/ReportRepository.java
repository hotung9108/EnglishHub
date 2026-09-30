package com.english_hub.core.modules.report.domain.repository;

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
import java.time.OffsetDateTime;
import java.util.List;

public interface ReportRepository {
	boolean classExists(long classId);

	List<Long> findClassIds(Long teacherId, Long classId);

	ReportClassPage findClassPage(Long teacherId, int page, int limit);

	List<ReportAssignmentCount> countAssignments(List<Long> classIds, OffsetDateTime from, OffsetDateTime to);

	List<ReportMemberCount> countCurrentMembers(List<Long> classIds);

	List<ReportAssignmentCompletionCount> countCompletedMembersByAssignment(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to);

	List<ReportStudentCompletion> countCompletedAssignmentsByStudent(
			long classId,
			OffsetDateTime from,
			OffsetDateTime to);

	List<ReportMemberRow> findCurrentMembers(long classId);

	List<ReportAssignmentRow> findAssignments(long classId, OffsetDateTime from, OffsetDateTime to);

	List<ReportSubmissionScore> findSubmissionScores(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to);

	List<ReportPendingByStatus> countPendingGradings(
			List<Long> classIds,
			OffsetDateTime from,
			OffsetDateTime to);

	ReportStudentIdentity findStudent(long studentId);

	List<ReportStudentAttemptScore> findStudentAttemptScores(
			long studentId, Long classId, OffsetDateTime from, OffsetDateTime to);

	List<ReportStudentSkillScore> findStudentSkillScores(
			long studentId, Long classId, OffsetDateTime from, OffsetDateTime to);
}
