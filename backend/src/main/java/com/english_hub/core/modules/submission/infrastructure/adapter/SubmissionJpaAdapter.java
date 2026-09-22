package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.SubmissionStatus;
import com.english_hub.core.modules.submission.application.page.SubmissionPageRequest;
import com.english_hub.core.modules.submission.domain.model.Submission;
import com.english_hub.core.modules.submission.domain.model.SubmissionFilter;
import com.english_hub.core.modules.submission.domain.model.SubmissionPage;
import com.english_hub.core.modules.submission.domain.repository.SubmissionRepository;
import com.english_hub.core.modules.submission.infrastructure.mapper.SubmissionPersistenceMapper;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataSubmissionRepository;

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

/** JPA adapter for the {@link SubmissionRepository} domain port. */
@Repository
public class SubmissionJpaAdapter implements SubmissionRepository {

	private final SpringDataSubmissionRepository jpaRepository;
	private final SubmissionPersistenceMapper mapper;

	public SubmissionJpaAdapter(SpringDataSubmissionRepository jpaRepository, SubmissionPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional
	public Submission create(Long assignmentId, Long studentId, int attemptNumber) {
		Submission domain = new Submission(assignmentId, studentId, attemptNumber, null, domainStatus(SubmissionStatus.IN_PROGRESS));
		return mapper.toDomain(jpaRepository.saveAndFlush(mapper.toEntity(domain)));
	}

	@Override
	@Transactional(readOnly = true)
	public long countByAssignmentIdAndStudentId(Long assignmentId, Long studentId) {
		return jpaRepository.countByAssignmentIdAndStudentId(assignmentId, studentId);
	}

	@Override
	@Transactional(readOnly = true)
	public SubmissionPage findPage(SubmissionFilter filter, SubmissionPageRequest pageRequest) {
		Specification<com.english_hub.core.infrastructure.persistence.entity.Submission> specification =
				buildSpecification(filter);
		Pageable pageable = PageRequest.of(
				pageRequest.page() - 1,
				pageRequest.limit(),
				Sort.by(Sort.Direction.DESC, "id"));
		Page<com.english_hub.core.infrastructure.persistence.entity.Submission> page =
				jpaRepository.findAll(specification, pageable);
		List<Submission> submissions = page.getContent().stream().map(mapper::toDomain).toList();
		return new SubmissionPage(submissions, pageRequest.page(), pageRequest.limit(), page.getTotalElements());
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Submission> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Submission> findAll() {
		return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public boolean existsById(Long id) {
		return jpaRepository.existsById(id);
	}

	@Override
	@Transactional(readOnly = true)
	public long count() {
		return jpaRepository.count();
	}

	@Override
	@Transactional
	public Submission save(Submission entity) {
		return mapper.toDomain(jpaRepository.save(mapper.toEntity(entity)));
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}

	private Specification<com.english_hub.core.infrastructure.persistence.entity.Submission> buildSpecification(
			SubmissionFilter filter) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			if (filter.assignmentId() != null) {
				predicates.add(criteriaBuilder.equal(root.get("assignmentId"), filter.assignmentId()));
			}
			if (filter.studentId() != null) {
				predicates.add(criteriaBuilder.equal(root.get("studentId"), filter.studentId()));
			}
			if (filter.status() != null) {
				predicates.add(criteriaBuilder.equal(
						root.get("status"), SubmissionStatus.valueOf(filter.status().name())));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}

	private com.english_hub.core.modules.submission.domain.model.SubmissionStatus domainStatus(SubmissionStatus status) {
		return com.english_hub.core.modules.submission.domain.model.SubmissionStatus.valueOf(status.name());
	}
}