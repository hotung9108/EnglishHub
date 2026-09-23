package com.english_hub.core.modules.classroom.infrastructure.persistence.repository;

import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassMemberJpaRepository extends JpaRepository<ClassMemberEntity, Long> {

	List<ClassMemberEntity> findByClassId(Long classId);

	long countByClassId(Long classId);

	boolean existsByClassIdAndStudentId(Long classId, Long studentId);

	boolean existsByClassId(Long classId);

	Optional<ClassMemberEntity> findByClassIdAndId(Long classId, Long memberId);
}