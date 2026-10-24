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
import com.english_hub.core.modules.assignment.infrastructure.mapper.AssignmentSkillPersistenceMapper;
import com.english_hub.core.modules.assignment.infrastructure.persistence.projection.AssignmentSkillProjection;
import com.english_hub.core.modules.assignment.infrastructure.persistence.repository.AssignmentSkillJpaRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/** JPA adapter for the Assignment domain repository port. */
@Repository
public class AssignmentJpaAdapter implements com.english_hub.core.modules.assignment.domain.repository.AssignmentRepository {

	private final AssignmentRepository jpaRepository;
	private final AssignmentModuleRepository assignmentModuleRepository;
	private final AssignmentPersistenceMapper mapper;
	private final AssignmentSkillJpaRepository assignmentSkillJpaRepository;
	private final AssignmentSkillPersistenceMapper skillMapper;

	public AssignmentJpaAdapter(
			AssignmentRepository jpaRepository,
			AssignmentModuleRepository assignmentModuleRepository,
			AssignmentPersistenceMapper mapper,
			AssignmentSkillJpaRepository assignmentSkillJpaRepository,
			AssignmentSkillPersistenceMapper skillMapper) {
		this.jpaRepository = jpaRepository;
		this.assignmentModuleRepository = assignmentModuleRepository;
		this.mapper = mapper;
		this.assignmentSkillJpaRepository = assignmentSkillJpaRepository;
		this.skillMapper = skillMapper;
	}

	@Override
	public Optional<Assignment> findById(Long id) {
		return jpaRepository.findById(id)
				.filter(entity -> !entity.isDeleted())
				.map(mapper::toDomain);
	}

	@Override
	public Optional<Assignment> findByIdForUpdate(Long id) {
		return jpaRepository.findByIdForUpdate(id)
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
		Pageable pageable = PageRequest.of(pageRequest.page() - 1, pageRequest.limit());
		// Single round-trip: the total rows are returned by COUNT(*) OVER () in the
		// same query instead of a separate COUNT issued by Spring Data's Page support.
		List<Object[]> rows = status == null
				? jpaRepository.findPageWithTotalElements(classId, pageable)
				: jpaRepository.findPageWithStatusAndTotalElements(
						classId,
						com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.valueOf(status.name()),
						pageable);
		if (rows.isEmpty()) {
			return new AssignmentPage(List.of(), pageRequest.page(), pageRequest.limit(), 0);
		}
		long totalElements = ((Number) rows.get(0)[1]).longValue();
		List<Assignment> assignments = rows.stream()
				.map(row -> mapper.toDomain((com.english_hub.core.infrastructure.persistence.entity.Assignment) row[0]))
				.toList();
		return new AssignmentPage(assignments, pageRequest.page(), pageRequest.limit(), totalElements);
	}

	@Override
	public Map<Long, List<ModuleSkill>> findSkillsByAssignmentIds(List<Long> assignmentIds) {
		if (assignmentIds.isEmpty()) {
			return Map.of();
		}
		List<AssignmentSkillProjection> modules = assignmentSkillJpaRepository
				.findByAssignmentIdInOrderByAssignmentIdAscOrderIndexAscIdAsc(assignmentIds);
		return skillMapper.toSkillsByAssignmentId(modules);
	}

	@Override
	public List<AssignmentModuleSummary> findModuleSummaries(Long assignmentId) {
		return assignmentModuleRepository.findByAssignmentIdOrderByOrderIndexAsc(assignmentId).stream()
				.map(this::toModuleSummary)
				.toList();
	}

	private AssignmentModuleSummary toModuleSummary(AssignmentModule module) {
		return new AssignmentModuleSummary(module.getId(), module.getSkill().name());
	}
}
