package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.ClassMemberRepository;
import com.english_hub.core.modules.submission.domain.repository.StudentClassEnrollmentRepository;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link StudentClassEnrollmentRepository} read port. */
@Repository
public class StudentClassEnrollmentJpaAdapter implements StudentClassEnrollmentRepository {

	private final ClassMemberRepository classMemberRepository;

	public StudentClassEnrollmentJpaAdapter(ClassMemberRepository classMemberRepository) {
		this.classMemberRepository = classMemberRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isStudentInClass(Long studentId, Long classId) {
		return classMemberRepository.existsByClassIdAndStudentId(classId, studentId);
	}
}