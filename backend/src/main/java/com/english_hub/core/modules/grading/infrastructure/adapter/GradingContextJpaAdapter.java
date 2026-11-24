package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.grading.application.dto.GradingMetadata;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import jakarta.persistence.EntityManager;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class GradingContextJpaAdapter implements GradingContextRepository {

	private final GradingRepository gradingRepository;
	private final SubmissionModuleRepository submissionModuleRepository;
	private final SubmissionRepository submissionRepository;
	private final AnswerRepository answerRepository;
	private final com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository assignmentRepository;
	private final ClassRepository classRepository;
	private final ModuleRepository moduleRepository;
	private final EntityManager entityManager;

	@Autowired
	public GradingContextJpaAdapter(
			GradingRepository gradingRepository,
			SubmissionModuleRepository submissionModuleRepository,
			SubmissionRepository submissionRepository,
			AnswerRepository answerRepository,
			com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ModuleRepository moduleRepository,
			EntityManager entityManager) {
		this.gradingRepository = gradingRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.submissionRepository = submissionRepository;
		this.answerRepository = answerRepository;
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.moduleRepository = moduleRepository;
		this.entityManager = entityManager;
	}

	public GradingContextJpaAdapter(
			GradingRepository gradingRepository,
			SubmissionModuleRepository submissionModuleRepository,
			SubmissionRepository submissionRepository,
			AnswerRepository answerRepository,
			com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ModuleRepository moduleRepository) {
		this(
				gradingRepository,
				submissionModuleRepository,
				submissionRepository,
				answerRepository,
				assignmentRepository,
				classRepository,
				moduleRepository,
				null);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<GradingContext> findBySubmissionModuleId(Long submissionModuleId) {
		return submissionModuleRepository.findById(submissionModuleId).flatMap(submissionModule ->
			submissionRepository.findById(submissionModule.getSubmissionId()).flatMap(submission ->
				assignmentRepository.findById(submission.getAssignmentId()).flatMap(assignment ->
					classRepository.findById(assignment.classId()).map(englishClass -> {
						var module = moduleRepository.findById(submissionModule.getModuleId()).orElse(null);
						/*
						 * Derived from the module row alone. The parent submission's submittedAt is
						 * only stamped by the final submit, so requiring it here reported every
						 * per-module submit as not yet submitted.
						 */
						boolean submitted = submissionModule.getStatus()
								!= com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus.IN_PROGRESS;
						return new GradingContext(
								submissionModule.getId(),
								submissionModule.getModuleId(),
								null,
								submission.getId(),
								assignment.id(),
								englishClass.getId(),
								englishClass.getTeacherId(),
								submission.getStudentId(),
								module == null ? null : module.skill(),
								submitted,
								null,
								module == null ? null : module.taskType(),
								module == null ? null : module.maxScore(),
								module == null ? null : module.instructions());
					}))));
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<GradingContext> findByGradingId(Long gradingId) {
		return gradingRepository.findById(gradingId)
				.flatMap(grading -> findBySubmissionModuleId(grading.getSubmissionModuleId()));
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<GradingContext> findByAnswerId(Long answerId) {
		return answerRepository.findById(answerId).flatMap(answer ->
				findBySubmissionModuleId(answer.getSubmissionModuleId())
						.map(context -> context.withAnswer(
								answer.getId(),
								answer.getContent() == null ? null : answer.getContent().length())));
	}

	@Override
	@Transactional(readOnly = true)
	public Map<Long, GradingMetadata> findMetadataBySubmissionModuleIds(Collection<Long> submissionModuleIds) {
		if (submissionModuleIds == null || submissionModuleIds.isEmpty() || entityManager == null) {
			return Map.of();
		}
		String jpql = """
				select sm.id, a.id, a.title, c.id, c.name, t.id, t.fullName, s.id, s.fullName
				from SubmissionModule sm
				join Submission sub on sm.submissionId = sub.id
				join Assignment a on sub.assignmentId = a.id
				join ClassEntity c on a.classId = c.id
				left join User t on c.teacherId = t.id
				left join User s on sub.studentId = s.id
				where sm.id in :submissionModuleIds
				""";
		List<Object[]> rows = entityManager.createQuery(jpql, Object[].class)
				.setParameter("submissionModuleIds", submissionModuleIds)
				.getResultList();
		Map<Long, GradingMetadata> result = new HashMap<>();
		for (Object[] row : rows) {
			Long smId = (Long) row[0];
			Long assignmentId = (Long) row[1];
			String assignmentTitle = (String) row[2];
			Long classId = (Long) row[3];
			String className = (String) row[4];
			Long teacherId = (Long) row[5];
			String teacherName = (String) row[6];
			Long studentId = (Long) row[7];
			String studentName = (String) row[8];
			result.put(
					smId,
					new GradingMetadata(
							smId,
							assignmentId,
							assignmentTitle,
							classId,
							className,
							teacherId,
							teacherName,
							studentId,
							studentName));
		}
		return result;
	}
}
