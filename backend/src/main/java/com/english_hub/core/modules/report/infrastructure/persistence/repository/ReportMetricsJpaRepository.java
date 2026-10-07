package com.english_hub.core.modules.report.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import com.english_hub.core.infrastructure.persistence.entity.GradingStatus;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentCompletionCount;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentCount;
import com.english_hub.core.modules.report.domain.model.ReportAssignmentRow;
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
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface ReportMetricsJpaRepository extends Repository<
		com.english_hub.core.infrastructure.persistence.entity.Assignment, Long> {

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportAssignmentCount(
				a.classId, count(a.id))
			from Assignment a
			where a.classId in :classIds and a.deleted = false
			  and a.status in :assignmentStatuses
			  and (:filterFrom = false or a.openAt >= :fromAt)
			  and (:filterTo = false or a.openAt < :toAt)
			group by a.classId
			""")
	List<ReportAssignmentCount> countAssignments(
			@Param("classIds") List<Long> classIds,
			@Param("assignmentStatuses") List<AssignmentStatus> assignmentStatuses,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportMemberCount(
				m.classId, count(distinct m.studentId))
			from ClassMember m, User u
			where m.classId in :classIds and u.id = m.studentId
			  and u.role = :studentRole and u.deleted = false
			group by m.classId
			""")
	List<ReportMemberCount> countCurrentMembers(
			@Param("classIds") List<Long> classIds,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportAssignmentCompletionCount(
				a.classId, a.id, count(distinct s.studentId))
			from Assignment a
			join ClassMember m on m.classId = a.classId
			join User u on u.id = m.studentId
			left join Submission s on s.assignmentId = a.id and s.studentId = m.studentId
				and s.status in :submissionStatuses
			where a.classId in :classIds and a.deleted = false
			  and a.status in :assignmentStatuses
			  and u.role = :studentRole and u.deleted = false
			  and (:filterFrom = false or a.openAt >= :fromAt)
			  and (:filterTo = false or a.openAt < :toAt)
			group by a.classId, a.id
			""")
	List<ReportAssignmentCompletionCount> countCompletedMembersByAssignment(
			@Param("classIds") List<Long> classIds,
			@Param("assignmentStatuses") List<AssignmentStatus> assignmentStatuses,
			@Param("submissionStatuses") List<SubmissionStatus> submissionStatuses,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportStudentCompletion(
				m.classId, m.studentId, count(distinct a.id))
			from ClassMember m, User u, Assignment a, Submission s
			where m.classId = :classId and u.id = m.studentId
			  and a.classId = m.classId and s.assignmentId = a.id and s.studentId = m.studentId
			  and a.deleted = false and a.status in :assignmentStatuses
			  and s.status in :submissionStatuses and u.role = :studentRole and u.deleted = false
			  and (:filterFrom = false or a.openAt >= :fromAt)
			  and (:filterTo = false or a.openAt < :toAt)
			group by m.classId, m.studentId
			""")
	List<ReportStudentCompletion> countCompletedAssignmentsByStudent(
			@Param("classId") long classId,
			@Param("assignmentStatuses") List<AssignmentStatus> assignmentStatuses,
			@Param("submissionStatuses") List<SubmissionStatus> submissionStatuses,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportMemberRow(
				m.classId, m.studentId, u.fullName)
			from ClassMember m, User u
			where m.classId = :classId and u.id = m.studentId
			  and u.role = :studentRole and u.deleted = false
			order by u.fullName, m.studentId
			""")
	List<ReportMemberRow> findCurrentMembers(
			@Param("classId") long classId,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportAssignmentRow(a.id, a.title)
			from Assignment a
			where a.classId = :classId and a.deleted = false and a.status in :assignmentStatuses
			  and (:filterFrom = false or a.openAt >= :fromAt)
			  and (:filterTo = false or a.openAt < :toAt)
			order by a.openAt, a.id
			""")
	List<ReportAssignmentRow> findAssignments(
			@Param("classId") long classId,
			@Param("assignmentStatuses") List<AssignmentStatus> assignmentStatuses,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportSubmissionScore(
				s.id, a.id, a.classId, s.studentId, s.submittedAt,
				sum(case when g.status = :completedStatus and g.finalScore is not null then g.finalScore end),
				sum(case when g.status = :completedStatus and g.finalScore is not null
					then coalesce(g.maxScoreSnapshot, m.maxScore) end),
				count(distinct sm.id),
				count(distinct case when g.status = :completedStatus and g.finalScore is not null then sm.id end))
			from Submission s
			join Assignment a on a.id = s.assignmentId
			join ClassEntity c on c.id = a.classId
			join User u on u.id = s.studentId
			join SubmissionModule sm on sm.submissionId = s.id
			join AssignmentModule m on m.id = sm.moduleId
			left join Grading g on g.submissionModuleId = sm.id
			where a.classId in :classIds and a.deleted = false
			  and s.status in :submissionStatuses and u.role = :studentRole and u.deleted = false
			  and (:filterFrom = false or s.submittedAt >= :fromAt)
			  and (:filterTo = false or s.submittedAt < :toAt)
			  and (c.teacherId is null or exists (
				  select t.id from User t where t.id = c.teacherId and t.deleted = false))
			group by s.id, a.id, a.classId, s.studentId, s.submittedAt
			""")
	List<ReportSubmissionScore> findSubmissionScores(
			@Param("classIds") List<Long> classIds,
			@Param("submissionStatuses") List<SubmissionStatus> submissionStatuses,
			@Param("completedStatus") GradingStatus completedStatus,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportPendingByStatus(
				g.status, count(g.id))
			from Grading g, SubmissionModule sm, Submission s, Assignment a, User u
			where g.submissionModuleId = sm.id and sm.submissionId = s.id
			  and s.assignmentId = a.id and s.studentId = u.id
			  and a.classId in :classIds and a.deleted = false
			  and u.role = :studentRole and u.deleted = false
			  and s.status in :submissionStatuses and g.status in :pendingStatuses
			  and (:filterFrom = false or s.submittedAt >= :fromAt)
			  and (:filterTo = false or s.submittedAt < :toAt)
			group by g.status
			""")
	List<ReportPendingByStatus> countPendingGradings(
			@Param("classIds") List<Long> classIds,
			@Param("submissionStatuses") List<SubmissionStatus> submissionStatuses,
			@Param("pendingStatuses") List<GradingStatus> pendingStatuses,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportStudentIdentity(
				u.id, u.fullName)
			from User u
			where u.id = :studentId and u.role = :studentRole and u.deleted = false
			""")
	ReportStudentIdentity findStudent(
			@Param("studentId") long studentId,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportStudentAttemptScore(
				s.id, a.id, a.classId, s.studentId, s.submittedAt, a.title,
				sum(case when g.status = :completedStatus and g.finalScore is not null then g.finalScore end),
				sum(case when g.status = :completedStatus and g.finalScore is not null
					then coalesce(g.maxScoreSnapshot, m.maxScore) end),
				count(distinct sm.id),
				count(distinct case when g.status = :completedStatus and g.finalScore is not null then sm.id end))
			from Submission s
			join Assignment a on a.id = s.assignmentId
			join ClassEntity c on c.id = a.classId
			join User u on u.id = s.studentId
			join SubmissionModule sm on sm.submissionId = s.id
			join AssignmentModule m on m.id = sm.moduleId
			left join Grading g on g.submissionModuleId = sm.id
			where s.studentId = :studentId and a.deleted = false
			  and s.status in :submissionStatuses and u.role = :studentRole and u.deleted = false
			  and (:filterClass = false or a.classId = :classId)
			  and (:filterFrom = false or s.submittedAt >= :fromAt)
			  and (:filterTo = false or s.submittedAt < :toAt)
			  and (c.teacherId is null or exists (
				  select t.id from User t where t.id = c.teacherId and t.deleted = false))
			group by s.id, a.id, a.classId, s.studentId, s.submittedAt, a.title
			""")
	List<ReportStudentAttemptScore> findStudentAttemptScores(
			@Param("studentId") long studentId,
			@Param("classId") Long classId,
			@Param("submissionStatuses") List<SubmissionStatus> submissionStatuses,
			@Param("completedStatus") GradingStatus completedStatus,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterClass") boolean filterClass,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);

	@Query("""
			select new com.english_hub.core.modules.report.domain.model.ReportStudentSkillScore(
				s.id, m.skill, sum(g.finalScore), sum(coalesce(g.maxScoreSnapshot, m.maxScore)))
			from Submission s
			join Assignment a on a.id = s.assignmentId
			join ClassEntity c on c.id = a.classId
			join User u on u.id = s.studentId
			join SubmissionModule sm on sm.submissionId = s.id
			join AssignmentModule m on m.id = sm.moduleId
			join Grading g on g.submissionModuleId = sm.id
			where s.studentId = :studentId and a.deleted = false
			  and s.status in :submissionStatuses and g.status = :completedStatus and g.finalScore is not null
			  and u.role = :studentRole and u.deleted = false
			  and (:filterClass = false or a.classId = :classId)
			  and (:filterFrom = false or s.submittedAt >= :fromAt)
			  and (:filterTo = false or s.submittedAt < :toAt)
			  and (c.teacherId is null or exists (
				  select t.id from User t where t.id = c.teacherId and t.deleted = false))
			group by s.id, m.skill
			""")
	List<ReportStudentSkillScore> findStudentSkillScores(
			@Param("studentId") long studentId,
			@Param("classId") Long classId,
			@Param("submissionStatuses") List<SubmissionStatus> submissionStatuses,
			@Param("completedStatus") GradingStatus completedStatus,
			@Param("studentRole") com.english_hub.core.common.domain.UserRole studentRole,
			@Param("fromAt") OffsetDateTime fromAt,
			@Param("toAt") OffsetDateTime toAt,
			@Param("filterClass") boolean filterClass,
			@Param("filterFrom") boolean filterFrom,
			@Param("filterTo") boolean filterTo);
}
