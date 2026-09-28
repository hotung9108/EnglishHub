package com.english_hub.core.modules.question.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.AnswerRepository;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.repository.QuestionRepository;
import com.english_hub.core.modules.question.infrastructure.mapper.QuestionPersistenceMapper;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class QuestionJpaAdapter implements QuestionRepository {

	private final com.english_hub.core.infrastructure.persistence.repository.QuestionRepository questionJpaRepository;
	private final AnswerRepository answerRepository;
	private final QuestionPersistenceMapper mapper;

	public QuestionJpaAdapter(
			com.english_hub.core.infrastructure.persistence.repository.QuestionRepository questionJpaRepository,
			AnswerRepository answerRepository,
			QuestionPersistenceMapper mapper) {
		this.questionJpaRepository = questionJpaRepository;
		this.answerRepository = answerRepository;
		this.mapper = mapper;
	}

	@Override
	public List<Question> findByModuleIdOrderByOrderIndexAsc(Long moduleId) {
		return questionJpaRepository.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
				.map(mapper::toDomain)
				.toList();
	}

	@Override
	public Optional<Question> findById(Long id) {
		return questionJpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public Question save(Question question) {
		com.english_hub.core.infrastructure.persistence.entity.Question saved;
		if (question.id() == null) {
			saved = questionJpaRepository.save(mapper.toNewEntity(question));
		} else {
			com.english_hub.core.infrastructure.persistence.entity.Question target = questionJpaRepository
					.findById(question.id())
					.orElseThrow(() -> new IllegalArgumentException("Question not found: " + question.id()));
			mapper.updateEntity(target, question);
			saved = questionJpaRepository.save(target);
		}
		return mapper.toDomain(saved);
	}

	@Override
	public boolean existsByModuleIdAndOrderIndex(Long moduleId, int orderIndex) {
		return questionJpaRepository.existsByModuleIdAndOrderIndex(moduleId, orderIndex);
	}

	@Override
	public boolean existsByModuleIdAndOrderIndexAndIdNot(Long moduleId, int orderIndex, Long questionId) {
		return questionJpaRepository.existsByModuleIdAndOrderIndexAndIdNot(moduleId, orderIndex, questionId);
	}

	@Override
	public boolean existsAnswerReference(Long questionId) {
		return answerRepository.existsByQuestionId(questionId);
	}

	@Override
	public void deleteById(Long id) {
		questionJpaRepository.deleteById(id);
	}
}
