package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.Submission;
import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.grading.domain.model.Grading;
import com.english_hub.core.modules.grading.domain.model.GradingFilter;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import com.english_hub.core.modules.grading.domain.repository.GradingRepository;
import com.english_hub.core.modules.grading.infrastructure.mapper.GradingPersistenceMapper;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class GradingJpaAdapter implements GradingRepository {

	private final com.english_hub.core.infrastructure.persistence.repository.GradingRepository jpaRepository;
	private final GradingPersistenceMapper mapper;

	public GradingJpaAdapter(
			com.english_hub.core.infrastructure.persistence.repository.GradingRepository jpaRepository,
			GradingPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Grading> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Grading> findBySubmissionModuleId(Long submissionModuleId) {
		return jpaRepository.findBySubmissionModuleId(submissionModuleId).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public GradingPage findPage(GradingFilter filter, int page, int limit) {
		Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "id"));
		Page<com.english_hub.core.infrastructure.persistence.entity.Grading> result =
				jpaRepository.findAll(buildSpecification(filter), pageable);
		return new GradingPage(
				result.getContent().stream().map(mapper::toDomain).toList(),
				page,
				limit,
				result.getTotalElements());
	}

	@Override
	@Transactional
	public Grading saveTeacherGrade(Grading source) {
		com.english_hub.core.infrastructure.persistence.entity.Grading target =
				jpaRepository.findById(source.id()).orElseThrow();
		target.updateTeacherGrade(
				source.finalScore(), source.finalFeedback(), source.reviewedBy(), source.reviewedAt());
		return mapper.toDomain(jpaRepository.save(target));
	}

	private Specification<com.english_hub.core.infrastructure.persistence.entity.Grading> buildSpecification(
			GradingFilter filter) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			if (filter.status() != null) {
				predicates.add(criteriaBuilder.equal(
						root.get("status"),
						com.english_hub.core.infrastructure.persistence.entity.GradingStatus.valueOf(
								filter.status().name())));
			}
			if (filter.classId() != null || filter.studentId() != null || filter.teacherId() != null) {
				Subquery<Long> contextIds = query.subquery(Long.class);
				Root<SubmissionModule> submissionModule = contextIds.from(SubmissionModule.class);
				Root<Submission> submission = contextIds.from(Submission.class);
				List<Predicate> contextPredicates = new ArrayList<>();
				contextPredicates.add(criteriaBuilder.equal(
						root.get("submissionModuleId"), submissionModule.get("id")));
				contextPredicates.add(criteriaBuilder.equal(
						submissionModule.get("submissionId"), submission.get("id")));
				if (filter.studentId() != null) {
					contextPredicates.add(criteriaBuilder.equal(submission.get("studentId"), filter.studentId()));
				}
				if (filter.classId() != null || filter.teacherId() != null) {
					Root<Assignment> assignment = contextIds.from(Assignment.class);
					contextPredicates.add(criteriaBuilder.equal(submission.get("assignmentId"), assignment.get("id")));
					if (filter.classId() != null) {
						contextPredicates.add(criteriaBuilder.equal(assignment.get("classId"), filter.classId()));
					}
					if (filter.teacherId() != null) {
						Root<ClassEntity> classEntity = contextIds.from(ClassEntity.class);
						contextPredicates.add(criteriaBuilder.equal(assignment.get("classId"), classEntity.get("id")));
						contextPredicates.add(criteriaBuilder.equal(classEntity.get("teacherId"), filter.teacherId()));
					}
				}
				contextIds.select(submissionModule.get("id"))
						.where(criteriaBuilder.and(contextPredicates.toArray(Predicate[]::new)));
				predicates.add(root.get("submissionModuleId").in(contextIds));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}
}
