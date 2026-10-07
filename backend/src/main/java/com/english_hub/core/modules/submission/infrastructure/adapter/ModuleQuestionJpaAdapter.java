package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.entity.Question;
import com.english_hub.core.modules.submission.domain.model.ModuleQuestion;
import com.english_hub.core.modules.submission.domain.model.QuestionDetail;
import com.english_hub.core.modules.submission.domain.model.QuestionType;
import com.english_hub.core.modules.submission.domain.repository.ModuleQuestionRepository;
import com.english_hub.core.modules.submission.infrastructure.persistence.repository.SpringDataQuestionRepository;

import java.util.List;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link ModuleQuestionRepository} domain port. */
@Repository
public class ModuleQuestionJpaAdapter implements ModuleQuestionRepository {

	private final SpringDataQuestionRepository jpaRepository;

	public ModuleQuestionJpaAdapter(SpringDataQuestionRepository jpaRepository) {
		this.jpaRepository = jpaRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ModuleQuestion> findByModuleId(Long moduleId) {
		return jpaRepository.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
				.map(this::toDomain)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<QuestionDetail> findDetailsByModuleId(Long moduleId) {
		return jpaRepository.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
				.map(this::toDetail)
				.toList();
	}

	private ModuleQuestion toDomain(Question source) {
		return new ModuleQuestion(
				source.getId(),
				source.getModuleId(),
				QuestionType.valueOf(source.getQuestionType().name()),
				source.getScore(),
				source.getOrderIndex());
	}

	private QuestionDetail toDetail(Question source) {
		return new QuestionDetail(
				source.getId(),
				source.getModuleId(),
				QuestionType.valueOf(source.getQuestionType().name()),
				source.getScore(),
				source.getOrderIndex(),
				source.getContent(),
				source.getCorrectAnswer());
	}
}