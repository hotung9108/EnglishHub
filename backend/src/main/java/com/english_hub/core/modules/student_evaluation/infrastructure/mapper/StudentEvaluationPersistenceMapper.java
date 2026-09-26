package com.english_hub.core.modules.student_evaluation.infrastructure.mapper;

import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import java.time.Instant;
import org.springframework.stereotype.Component;

@Component
public class StudentEvaluationPersistenceMapper {

	public StudentEvaluation toDomain(
			com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation source) {
		return toDomain(source, null);
	}

	public StudentEvaluation toDomain(
			com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation source,
			String teacherName) {
		return new StudentEvaluation(
				source.getId(),
				source.getStudentId(),
				source.getTeacherId(),
				source.getClassId(),
				teacherName,
				source.getContent(),
				source.getCreatedAt());
	}

	public com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation toNewEntity(
			StudentEvaluation source) {
		return new com.english_hub.core.infrastructure.persistence.entity.StudentEvaluation(
				source.studentId(),
				source.teacherId(),
				source.classId(),
				source.content());
	}
}
