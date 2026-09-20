package com.english_hub.core.modules.classroom.infrastructure.mapper;

import com.english_hub.core.modules.classroom.domain.model.ClassMember;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import org.springframework.stereotype.Component;

/** Maps between classroom domain models and their JPA entities. */
@Component
public class ClassPersistenceMapper {

	public EnglishClass toDomain(ClassEntity source) {
		EnglishClass target = new EnglishClass(
				source.getName(),
				source.getLevel(),
				source.getDescription(),
				source.getStartDate(),
				source.getEndDate(),
				source.getStatus(),
				source.getTeacherId());
		target.setId(source.getId());
		target.setCreatedAt(source.getCreatedAt());
		target.setUpdatedAt(source.getUpdatedAt());
		return target;
	}

	public ClassEntity toEntity(EnglishClass source) {
		ClassEntity target = new ClassEntity(
				source.getName(),
				source.getLevel(),
				source.getDescription(),
				source.getStartDate(),
				source.getEndDate(),
				source.getStatus(),
				source.getTeacherId());
		target.setId(source.getId());
		target.setCreatedAt(source.getCreatedAt());
		target.setUpdatedAt(source.getUpdatedAt());
		return target;
	}

	public ClassMember toDomain(ClassMemberEntity source) {
		ClassMember target = new ClassMember(source.getClassId(), source.getStudentId());
		target.setId(source.getId());
		target.setCreatedAt(source.getCreatedAt());
		return target;
	}

	public ClassMemberEntity toEntity(ClassMember source) {
		ClassMemberEntity target = new ClassMemberEntity(source.getClassId(), source.getStudentId());
		target.setId(source.getId());
		target.setCreatedAt(source.getCreatedAt());
		return target;
	}
}