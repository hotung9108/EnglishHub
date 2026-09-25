package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.modules.submission.domain.model.Grading;
import com.english_hub.core.modules.submission.domain.model.GradingDraft;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.repository.GradingRepository;
import com.english_hub.core.modules.submission.infrastructure.mapper.SubmissionPersistenceMapper;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataGradingRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link GradingRepository} domain port. */
@Repository
public class GradingJpaAdapter implements GradingRepository {

	private final SpringDataGradingRepository jpaRepository;
	private final SubmissionPersistenceMapper mapper;

	public GradingJpaAdapter(SpringDataGradingRepository jpaRepository, SubmissionPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional
	public List<Grading> bulkCreate(List<GradingDraft> drafts) {
		List<com.english_hub.core.infrastructure.persistence.entity.Grading> entities =
				drafts.stream()
						.map(draft -> mapper.toEntity(new Grading(
								draft.submissionModuleId(), draft.method(), GradingStatus.PENDING, null, null, null, null)))
						.toList();
		return jpaRepository.saveAllAndFlush(entities).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<Grading> findBySubmissionModuleId(Long submissionModuleId) {
		return jpaRepository.findBySubmissionModuleId(submissionModuleId).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<Grading> findBySubmissionModuleIds(Collection<Long> submissionModuleIds) {
		return jpaRepository.findBySubmissionModuleIdIn(submissionModuleIds).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Grading> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Grading> findAll() {
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
	public Grading save(Grading entity) {
		return mapper.toDomain(jpaRepository.save(mapper.toEntity(entity)));
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}