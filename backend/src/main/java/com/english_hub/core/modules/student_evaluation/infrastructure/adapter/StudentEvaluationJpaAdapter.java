package com.english_hub.core.modules.student_evaluation.infrastructure.adapter;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationFilter;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationPage;
import com.english_hub.core.modules.student_evaluation.domain.repository.StudentEvaluationRepository;
import com.english_hub.core.modules.student_evaluation.infrastructure.mapper.StudentEvaluationPersistenceMapper;
import jakarta.persistence.criteria.Predicate;
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
public class StudentEvaluationJpaAdapter implements StudentEvaluationRepository {

	private static final String EVALUATION_NOT_FOUND_MESSAGE = "Không tìm thấy đánh giá.";

	private final com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository jpaRepository;
	private final StudentEvaluationPersistenceMapper mapper;

	public StudentEvaluationJpaAdapter(
			com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository jpaRepository,
			StudentEvaluationPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<StudentEvaluation> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public StudentEvaluationPage findPage(StudentEvaluationFilter filter, int page, int limit) {
		Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
		Page<com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation> result =
				jpaRepository.findAll(buildSpecification(filter), pageable);
		return new StudentEvaluationPage(
				result.getContent().stream().map(mapper::toDomain).toList(),
				page,
				limit,
				result.getTotalElements());
	}

	@Override
	@Transactional
	public StudentEvaluation save(StudentEvaluation source) {
		com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation target;
		if (source.id() == null) {
			target = mapper.toNewEntity(source);
		} else {
			target = jpaRepository.findById(source.id())
					.orElseThrow(() -> ApiException.notFound(EVALUATION_NOT_FOUND_MESSAGE));
			target.updateContent(source.content());
		}
		return mapper.toDomain(jpaRepository.save(target), source.teacherName());
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}

	private Specification<com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation> buildSpecification(
			StudentEvaluationFilter filter) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			predicates.add(criteriaBuilder.equal(root.get("studentId"), filter.studentId()));
			if (filter.classId() != null) {
				predicates.add(criteriaBuilder.equal(root.get("classId"), filter.classId()));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}
}
