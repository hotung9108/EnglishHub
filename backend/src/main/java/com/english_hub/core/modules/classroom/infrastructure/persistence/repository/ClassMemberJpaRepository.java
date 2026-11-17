package com.english_hub.core.modules.classroom.infrastructure.persistence.repository;

import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ClassMemberJpaRepository extends JpaRepository<ClassMemberEntity, Long> {

	List<ClassMemberEntity> findByClassId(Long classId);

	long countByClassId(Long classId);

	boolean existsByClassIdAndStudentId(Long classId, Long studentId);

	boolean existsByClassId(Long classId);

	Optional<ClassMemberEntity> findByClassIdAndId(Long classId, Long memberId);

	@Query(value = """
			SELECT u.id, u.full_name, u.email, sp.student_code, CAST(u.status AS text)
			FROM users u
			LEFT JOIN student_profiles sp ON sp.user_id = u.id
			WHERE u.role = 'STUDENT'
			  AND u.is_deleted = false
			  AND u.status = 'ACTIVE'
			  AND u.id NOT IN (
			      SELECT cm.student_id
			      FROM class_members cm
			      WHERE cm.class_id = :classId
			  )
			  AND (
			      :query IS NULL OR :query = '' OR
			      LOWER(u.full_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
			      LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR
			      LOWER(COALESCE(sp.student_code, '')) LIKE LOWER(CONCAT('%', :query, '%'))
			  )
			ORDER BY u.full_name ASC, u.id ASC
			""",
			countQuery = """
			SELECT COUNT(u.id)
			FROM users u
			LEFT JOIN student_profiles sp ON sp.user_id = u.id
			WHERE u.role = 'STUDENT'
			  AND u.is_deleted = false
			  AND u.status = 'ACTIVE'
			  AND u.id NOT IN (
			      SELECT cm.student_id
			      FROM class_members cm
			      WHERE cm.class_id = :classId
			  )
			  AND (
			      :query IS NULL OR :query = '' OR
			      LOWER(u.full_name) LIKE LOWER(CONCAT('%', :query, '%')) OR
			      LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR
			      LOWER(COALESCE(sp.student_code, '')) LIKE LOWER(CONCAT('%', :query, '%'))
			  )
			""", nativeQuery = true)
	Page<Object[]> findCandidateStudentsRaw(
			@Param("classId") long classId,
			@Param("query") String query,
			Pageable pageable);
}