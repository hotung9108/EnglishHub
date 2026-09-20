package com.english_hub.core.modules.classroom.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassMember;
import java.util.List;
import java.util.Optional;

public interface ClassMemberRepository extends IRepository<ClassMember, Long> {

	List<ClassMember> findByClassId(Long classId);

	long countByClassId(Long classId);

	boolean existsByClassIdAndStudentId(Long classId, Long studentId);

	Optional<ClassMember> findByClassIdAndId(Long classId, Long memberId);
}