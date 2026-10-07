package com.english_hub.core.modules.module.infrastructure.mapper;

import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleUploadStatus;
import org.springframework.stereotype.Component;

@Component
public class ModulePersistenceMapper {

	public Module toDomain(AssignmentModule source) {
		return new Module(
				source.getId(),
				source.getAssignmentId(),
				com.english_hub.core.modules.module.domain.model.ModuleSkill.valueOf(source.getSkill().name()),
				com.english_hub.core.modules.module.domain.model.ModuleTaskType.valueOf(source.getTaskType().name()),
				source.getOrderIndex(),
				source.getInstructions(),
				source.getMaxScore(),
				source.getSourceAudioStorageKey(),
				source.getSourceAudioDurationSeconds(),
				source.getSourceAudioMimeType(),
				toDomainUploadStatus(source.getSourceAudioUploadStatus()),
				source.getAiInstruction());
	}

	public AssignmentModule toNewEntity(Module source) {
		return new AssignmentModule(
				source.assignmentId(),
				ModuleSkill.valueOf(source.skill().name()),
				ModuleTaskType.valueOf(source.taskType().name()),
				source.orderIndex(),
				source.instructions(),
				source.maxScore(),
				source.sourceAudioStorageKey(),
				source.sourceAudioDurationSeconds(),
				source.sourceAudioMimeType(),
				toPersistenceUploadStatus(source.sourceAudioUploadStatus()),
				source.aiInstruction());
	}

	public void updateEntity(AssignmentModule target, Module source) {
		target.updateDetails(
				source.orderIndex(),
				source.instructions(),
				source.maxScore(),
				source.aiInstruction());
		target.updateAudioMetadata(
				source.sourceAudioStorageKey(),
				source.sourceAudioDurationSeconds(),
				source.sourceAudioMimeType(),
				toPersistenceUploadStatus(source.sourceAudioUploadStatus()));
	}

	private ModuleUploadStatus toDomainUploadStatus(UploadStatus status) {
		return status == null ? null : ModuleUploadStatus.valueOf(status.name());
	}

	private UploadStatus toPersistenceUploadStatus(ModuleUploadStatus status) {
		return status == null ? null : UploadStatus.valueOf(status.name());
	}
}
