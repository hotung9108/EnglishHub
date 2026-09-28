package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.infrastructure.persistence.repository.GradingRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.SubmissionRepository;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.grading.domain.model.GradingContext;
import com.english_hub.core.modules.grading.domain.repository.GradingContextRepository;
import com.english_hub.core.modules.module.domain.repository.ModuleRepository;
import java.util.Optional;
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

	public GradingContextJpaAdapter(
			GradingRepository gradingRepository,
			SubmissionModuleRepository submissionModuleRepository,
			SubmissionRepository submissionRepository,
			AnswerRepository answerRepository,
			com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository assignmentRepository,
			ClassRepository classRepository,
			ModuleRepository moduleRepository) {
		this.gradingRepository = gradingRepository;
		this.submissionModuleRepository = submissionModuleRepository;
		this.submissionRepository = submissionRepository;
		this.answerRepository = answerRepository;
		this.assignmentRepository = assignmentRepository;
		this.classRepository = classRepository;
		this.moduleRepository = moduleRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<GradingContext> findBySubmissionModuleId(Long submissionModuleId) {
		return submissionModuleRepository.findById(submissionModuleId).flatMap(submissionModule ->
			submissionRepository.findById(submissionModule.getSubmissionId()).flatMap(submission ->
				assignmentRepository.findById(submission.getAssignmentId()).flatMap(assignment ->
					classRepository.findById(assignment.classId()).map(englishClass -> {
						var module = moduleRepository.findById(submissionModule.getModuleId()).orElse(null);
						boolean submitted = submission.getSubmittedAt() != null
								&& submission.getStatus() != com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus.IN_PROGRESS
								&& submissionModule.getStatus()
										!= com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus.IN_PROGRESS;
						return new GradingContext(
								submissionModule.getId(),
								null,
								submission.getId(),
								assignment.id(),
								englishClass.getId(),
								englishClass.getTeacherId(),
								submission.getStudentId(),
								module == null ? null : module.skill(),
								submitted,
								null);
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
					.map(context -> new GradingContext(
							context.submissionModuleId(),
							answer.getId(),
							context.submissionId(),
							context.assignmentId(),
							context.classId(),
							context.teacherId(),
							context.studentId(),
							context.moduleSkill(),
							context.submitted(),
							answer.getContent() == null ? null : answer.getContent().length())));
	}
}
