package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.AnswerAnnotationRepository;
import com.english_hub.core.modules.grading.domain.model.AnswerAnnotation;
import com.english_hub.core.modules.grading.infrastructure.mapper.GradingPersistenceMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class AnswerAnnotationJpaAdapter
		implements com.english_hub.core.modules.grading.domain.repository.AnswerAnnotationRepository {

	private final AnswerAnnotationRepository jpaRepository;
	private final GradingPersistenceMapper mapper;

	public AnswerAnnotationJpaAdapter(
			AnswerAnnotationRepository jpaRepository,
			GradingPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<AnswerAnnotation> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public List<AnswerAnnotation> findByAnswerId(Long answerId) {
		return jpaRepository.findByAnswerIdOrderByIdAsc(answerId).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional
	public AnswerAnnotation save(AnswerAnnotation source) {
		com.english_hub.core.infrastructure.persistence.entity.AnswerAnnotation target;
		if (source.id() == null) {
			target = mapper.toNewEntity(source);
		} else {
			target = jpaRepository.findById(source.id()).orElseThrow();
			target.updateReviewStatus(
					com.english_hub.core.infrastructure.persistence.entity.ReviewStatus.valueOf(
							source.reviewStatus().name()));
		}
		return mapper.toDomain(jpaRepository.save(target));
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}
