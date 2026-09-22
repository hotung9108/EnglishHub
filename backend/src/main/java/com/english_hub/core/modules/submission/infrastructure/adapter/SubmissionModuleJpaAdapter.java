package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.modules.submission.domain.model.SubmissionModule;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.domain.repository.SubmissionModuleRepository;
import com.english_hub.core.modules.submission.infrastructure.mapper.SubmissionPersistenceMapper;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataSubmissionModuleRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link SubmissionModuleRepository} domain port. */
@Repository
public class SubmissionModuleJpaAdapter implements SubmissionModuleRepository {

	private final SpringDataSubmissionModuleRepository jpaRepository;
	private final SubmissionPersistenceMapper mapper;

	public SubmissionModuleJpaAdapter(
			SpringDataSubmissionModuleRepository jpaRepository,
			SubmissionPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional
	public List<SubmissionModule> bulkCreate(Long submissionId, List<Long> moduleIds) {
		List<com.english_hub.core.infrastructure.persistence.entity.SubmissionModule> entities =
				moduleIds.stream()
						.map(moduleId -> mapper.toEntity(new SubmissionModule(
								submissionId, moduleId, SubmissionStatus.IN_PROGRESS)))
						.toList();
		return jpaRepository.saveAllAndFlush(entities).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<SubmissionModule> findBySubmissionId(Long submissionId) {
		return jpaRepository.findBySubmissionId(submissionId).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<SubmissionModule> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public List<SubmissionModule> findAll() {
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
	public SubmissionModule save(SubmissionModule entity) {
		return mapper.toDomain(jpaRepository.save(mapper.toEntity(entity)));
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}