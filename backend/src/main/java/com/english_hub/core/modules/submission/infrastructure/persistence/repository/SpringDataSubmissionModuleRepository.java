package com.english_hub.core.modules.submission.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.SubmissionModule;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data handle for the shared {@code submission_modules} JPA entity used by the submission cluster. */
public interface SpringDataSubmissionModuleRepository extends JpaRepository<SubmissionModule, Long> {

	List<SubmissionModule> findBySubmissionId(Long submissionId);
}