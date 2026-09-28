package com.english_hub.core.modules.assignment.infrastructure.mapper;

import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import org.springframework.stereotype.Component;

/** Maps the legacy persistence entity to the Assignment domain aggregate. */
@Component
public class AssignmentPersistenceMapper {

	public Assignment toDomain(com.english_hub.core.infrastructure.persistence.entity.Assignment source) {
		return new Assignment(
				source.getId(),
				source.getClassId(),
				source.getTitle(),
				source.getDescription(),
				source.getOpenAt(),
				source.getCloseAt(),
				source.getMaxSubmissions(),
				AssignmentStatus.valueOf(source.getStatus().name()),
				source.isDeleted(),
				source.getCreatedAt(),
				source.getUpdatedAt());
	}

	public com.english_hub.core.infrastructure.persistence.entity.Assignment toNewEntity(Assignment source) {
		return new com.english_hub.core.infrastructure.persistence.entity.Assignment(
				source.classId(),
				source.title(),
				source.description(),
				source.openAt(),
				source.closeAt(),
				source.maxSubmissions(),
				source.deleted(),
				toPersistenceStatus(source.status()));
	}

	public void updateEntity(
			com.english_hub.core.infrastructure.persistence.entity.Assignment target,
			Assignment source) {
		target.updateFrom(
				source.classId(),
				source.title(),
				source.description(),
				source.openAt(),
				source.closeAt(),
				source.maxSubmissions(),
				source.deleted(),
				toPersistenceStatus(source.status()));
	}

	private com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus toPersistenceStatus(
			AssignmentStatus status) {
		return com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.valueOf(status.name());
	}
}
