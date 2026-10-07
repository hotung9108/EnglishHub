package com.english_hub.core.modules.submission.domain.repository;

/** Read-only port for class teaching ownership, used to scope teacher reads. */
public interface ClassTeachingRepository {

	boolean isTeacherOfClass(Long teacherId, Long classId);
}