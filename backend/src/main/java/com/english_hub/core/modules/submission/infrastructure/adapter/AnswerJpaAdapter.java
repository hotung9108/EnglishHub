package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.modules.submission.domain.model.Answer;
import com.english_hub.core.modules.submission.domain.repository.AnswerRepository;
import com.english_hub.core.modules.submission.infrastructure.mapper.SubmissionPersistenceMapper;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataAnswerRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link AnswerRepository} domain port. */
@Repository
public class AnswerJpaAdapter implements AnswerRepository {

	private final SpringDataAnswerRepository jpaRepository;
	private final SubmissionPersistenceMapper mapper;

	public AnswerJpaAdapter(
			SpringDataAnswerRepository jpaRepository,
			SubmissionPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional
	public List<Answer> bulkCreate(Long submissionModuleId, List<Answer> answers) {
		List<com.english_hub.core.infrastructure.persistence.entity.Answer> entities =
				answers.stream().map(mapper::toEntity).toList();
		return jpaRepository.saveAllAndFlush(entities).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<Answer> findBySubmissionModuleId(Long submissionModuleId) {
		return jpaRepository.findBySubmissionModuleId(submissionModuleId).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<Answer> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public List<Answer> findAll() {
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
	public Answer save(Answer entity) {
		return mapper.toDomain(jpaRepository.save(mapper.toEntity(entity)));
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}