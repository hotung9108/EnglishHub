package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Assignment;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AssignmentRepository
		extends JpaRepository<Assignment, Long>, JpaSpecificationExecutor<Assignment> {

	boolean existsByClassId(Long classId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
	@Query("select assignment from Assignment assignment where assignment.id = :id")
	Optional<Assignment> findByIdForUpdate(@Param("id") Long id);

	long countByDeletedFalse();

	/**
	 * Page query that also returns the total number of matching rows.
	 *
	 * <p>{@code count(*) over ()} is evaluated before LIMIT/OFFSET, so a single
	 * round-trip replaces the separate COUNT query Spring Data issues for
	 * {@code Page}. On staging the database is in Singapore, so this saves one
	 * full network round-trip per assignment list request.</p>
	 *
	 * <p>Row layout: {@code [0] = Assignment, [1] = totalElements}.</p>
	 */
	@Query("""
			select assignment, count(*) over ()
			from Assignment assignment
			where assignment.classId = :classId
			  and assignment.deleted = false
			order by assignment.id desc
			""")
	List<Object[]> findPageWithTotalElements(@Param("classId") Long classId, Pageable pageable);

	/** Same as {@link #findPageWithTotalElements(Long, Pageable)} with a status filter. */
	@Query("""
			select assignment, count(*) over ()
			from Assignment assignment
			where assignment.classId = :classId
			  and assignment.deleted = false
			  and assignment.status = :status
			order by assignment.id desc
			""")
	List<Object[]> findPageWithStatusAndTotalElements(
			@Param("classId") Long classId,
			@Param("status") AssignmentStatus status,
			Pageable pageable);
}
