package com.english_hub.core.modules.submission.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Question;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data handle for the shared {@code questions} JPA entity used by the submission cluster. */
public interface SpringDataQuestionRepository extends JpaRepository<Question, Long> {

	List<Question> findByModuleIdOrderByOrderIndexAsc(Long moduleId);
}