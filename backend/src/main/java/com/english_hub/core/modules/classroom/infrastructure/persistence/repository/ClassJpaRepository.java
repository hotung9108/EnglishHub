package com.english_hub.core.modules.classroom.infrastructure.persistence.repository;

import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassJpaRepository
		extends JpaRepository<ClassEntity, Long>, JpaSpecificationExecutor<ClassEntity> {

	/**
	 * Fetches everything the authorisation checks need in one round-trip:
	 * the assigned teacher id and whether the user is a member of the class.
	 *
	 * <p>Returns an empty list when the class does not exist. Row layout is
	 * {@code [0] = teacher_id, [1] = is_member}.</p>
	 */
	@Query(value = """
			SELECT c.teacher_id,
			       EXISTS (
			           SELECT 1
			           FROM class_members m
			           WHERE m.class_id = c.id
			             AND m.student_id = :userId
			       ) AS is_member
			FROM classes c
			WHERE c.id = :classId
			""", nativeQuery = true)
	List<Object[]> findAccessRow(@Param("classId") long classId, @Param("userId") long userId);
}
