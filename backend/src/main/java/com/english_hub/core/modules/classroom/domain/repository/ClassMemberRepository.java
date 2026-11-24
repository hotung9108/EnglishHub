package com.english_hub.core.modules.classroom.domain.repository;

import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.classroom.domain.model.ClassCandidatePage;
import com.english_hub.core.modules.classroom.domain.model.ClassCandidateStudent;
import com.english_hub.core.modules.classroom.domain.model.ClassMember;
import com.english_hub.core.modules.classroom.domain.model.ClassMemberDetail;
import java.util.List;
import java.util.Optional;

public interface ClassMemberRepository extends IRepository<ClassMember, Long> {

	List<ClassMember> findByClassId(Long classId);

	List<ClassMemberDetail> findMembersWithStudentInfo(Long classId);

	ClassCandidatePage findCandidateStudents(long classId, String query, int page, int limit);

	default List<ClassCandidateStudent> findCandidateStudents(long classId, String query, int limit) {
		return findCandidateStudents(classId, query, 1, limit).candidates();
	}

	long countByClassId(Long classId);

	boolean existsByClassIdAndStudentId(Long classId, Long studentId);

	Optional<ClassMember> findByClassIdAndId(Long classId, Long memberId);
}