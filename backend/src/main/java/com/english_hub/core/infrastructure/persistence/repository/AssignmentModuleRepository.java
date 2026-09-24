package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import java.util.List;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

public interface AssignmentModuleRepository extends JpaRepository<AssignmentModule, Long> {

	List<AssignmentModule> findByAssignmentIdOrderByOrderIndexAsc(Long assignmentId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
	@Query("select module from AssignmentModule module where module.id = :id")
	Optional<AssignmentModule> findByIdForUpdate(@Param("id") Long id);

	boolean existsByAssignmentIdAndOrderIndex(Long assignmentId, int orderIndex);

	boolean existsByAssignmentIdAndOrderIndexAndIdNot(Long assignmentId, int orderIndex, Long id);
}
