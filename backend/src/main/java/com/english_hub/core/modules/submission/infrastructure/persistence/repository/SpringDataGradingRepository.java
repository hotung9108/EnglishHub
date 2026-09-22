package com.english_hub.core.modules.submission.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Grading;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data handle for the shared {@code gradings} JPA entity used by the submission cluster. */
public interface SpringDataGradingRepository extends JpaRepository<Grading, Long> {

	List<Grading> findBySubmissionModuleId(Long submissionModuleId);

	List<Grading> findBySubmissionModuleIdIn(Collection<Long> submissionModuleIds);
}