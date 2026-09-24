package com.english_hub.core.modules.submission.domain.repository;

/** Read-only port for the enrollment membership check, owned by the submission context. */
public interface StudentClassEnrollmentRepository {

	boolean isStudentInClass(Long studentId, Long classId);
}