package com.english_hub.core.modules.submission.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Answer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data handle for the shared {@code answers} JPA entity used by the submission cluster. */
public interface SpringDataAnswerRepository extends JpaRepository<Answer, Long> {

	List<Answer> findBySubmissionModuleId(Long submissionModuleId);
}