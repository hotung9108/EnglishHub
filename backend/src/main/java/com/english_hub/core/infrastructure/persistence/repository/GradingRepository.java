package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Grading;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

public interface GradingRepository extends JpaRepository<Grading, Long>, JpaSpecificationExecutor<Grading> {

	Optional<Grading> findBySubmissionModuleId(Long submissionModuleId);

	/**
	 * Locks the grading row so two concurrent auto-grading tasks for the same submission module
	 * serialize on it; the loser re-reads a non-pending status and skips.
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
	@Query("select grading from Grading grading where grading.submissionModuleId = :submissionModuleId")
	Optional<Grading> findBySubmissionModuleIdForUpdate(@Param("submissionModuleId") Long submissionModuleId);
}