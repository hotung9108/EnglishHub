package com.english_hub.core.modules.assignment.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.modules.assignment.application.page.AssignmentPageRequest;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.infrastructure.mapper.AssignmentPersistenceMapper;
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

/** JPA adapter for the Assignment domain repository port. */
@Repository
public class AssignmentJpaAdapter implements com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository {

	private final AssignmentRepository jpaRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final AssignmentPersistenceMapper mapper;

	public AssignmentJpaAdapter(
			AssignmentRepository jpaRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			AssignmentPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.mapper = mapper;
	}

	@Override
	public Optional<Assignment> findById(Long id) {
		return jpaRepository.findById(id)
				.filter(entity -> !entity.isDeleted())
				.map(mapper::toDomain);
	}

	@Override
	public List<Assignment> findAll() {
		return jpaRepository.findAll().stream()
				.filter(entity -> !entity.isDeleted())
				.map(mapper::toDomain)
				.toList();
	}

	@Override
	public boolean existsById(Long id) {
		return findById(id).isPresent();
	}

	@Override
	public long count() {
		return jpaRepository.countByDeletedFalse();
	}

	@Override
	public Assignment save(Assignment source) {
		com.english_hub.core.infrastructure.persistence.entity.Assignment target;
		if (source.id() == null) {
			target = mapper.toNewEntity(source);
		} else {
			target = jpaRepository.findById(source.id())
					.orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + source.id()));
			mapper.updateEntity(target, source);
		}
		return mapper.toDomain(jpaRepository.save(target));
	}

	@Override
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}

	@Override
	public AssignmentPage findPage(Long classId, AssignmentStatus status, AssignmentPageRequest pageRequest) {
		Pageable pageable = PageRequest.of(
				pageRequest.page() - 1,
				pageRequest.limit(),
				Sort.by(Sort.Direction.DESC, "id"));
		Page<com.english_hub.core.infrastructure.persistence.entity.Assignment> page =
				jpaRepository.findAll(buildSpecification(classId, status), pageable);
		List<Assignment> assignments = page.getContent().stream().map(mapper::toDomain).toList();
		return new AssignmentPage(assignments, pageRequest.page(), pageRequest.limit(), page.getTotalElements());
	}

	@Override
	public List<AssignmentModuleSummary> findModuleSummaries(Long assignmentId) {
		return assignmentModuleRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId).stream()
				.map(this::toModuleSummary)
				.toList();
	}

	private Specification<com.english_hub.core.infrastructure.persistence.entity.Assignment> buildSpecification(
			Long classId,
			AssignmentStatus status) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			predicates.add(criteriaBuilder.equal(root.get("classId"), classId));
			predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
			if (status != null) {
				predicates.add(criteriaBuilder.equal(
						root.get("status"),
						com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.valueOf(status.name())));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}

	private AssignmentModuleSummary toModuleSummary(AssignmentModule module) {
		return new AssignmentModuleSummary(module.getId(), module.getSkill().name());
	}
}
