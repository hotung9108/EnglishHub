package com.english_hub.core.modules.classroom.domain.repository;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.persistence.repository.IRepository;
import com.english_hub.core.modules.classroom.application.page.ClassPageRequest;
import com.english_hub.core.modules.classroom.domain.model.ClassPage;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import java.util.Optional;

public interface ClassRepository extends IRepository<EnglishClass, Long> {

	ClassPage findPage(ClassStatus status, UserRole callerRole, long callerUserId, ClassPageRequest pageRequest);

	Optional<TeacherInfo> findTeacher(Long teacherId);

	boolean teacherExists(Long teacherId);

	boolean hasRelatedData(Long classId);
}