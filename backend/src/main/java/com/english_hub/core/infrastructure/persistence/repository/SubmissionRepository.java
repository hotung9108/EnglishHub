package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Submission;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

	@Query("""
			select count(s.id) as attemptCount
			from Submission s
			where s.assignmentId = :assignmentId
			group by s.studentId
			order by attemptCount desc
			""")
	List<Long> findAttemptCountsByAssignmentId(@Param("assignmentId") Long assignmentId, Pageable pageable);
}
