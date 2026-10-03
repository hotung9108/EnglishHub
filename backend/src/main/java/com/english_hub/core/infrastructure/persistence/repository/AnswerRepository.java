package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {

	boolean existsByQuestionId(Long questionId);

	List<Answer> findBySubmissionModuleId(Long submissionModuleId);
}