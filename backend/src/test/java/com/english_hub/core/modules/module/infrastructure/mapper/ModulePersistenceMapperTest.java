package com.english_hub.core.modules.module.infrastructure.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.infrastructure.persistence.entity.AssignmentModule;
import com.english_hub.core.infrastructure.persistence.entity.ModuleSkill;
import com.english_hub.core.infrastructure.persistence.entity.ModuleTaskType;
import com.english_hub.core.infrastructure.persistence.entity.UploadStatus;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleUploadStatus;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class ModulePersistenceMapperTest {

	private final ModulePersistenceMapper mapper = new ModulePersistenceMapper();

	@Test
	void mapsEntityToDomainIncludingAudioMetadataAndUploadStatus() {
		AssignmentModule entity = new AssignmentModule(
				7L,
				ModuleSkill.LISTENING,
				ModuleTaskType.QUIZ,
				3,
				"Listen carefully",
				new BigDecimal("12.50"),
				"modules/7/audio/source.mp3",
				42,
				"audio/mpeg",
				UploadStatus.READY,
				"Grade listening");

		Module result = mapper.toDomain(entity);

		assertThat(result).isEqualTo(new Module(
				null,
				7L,
				com.english_hub.core.modules.module.domain.model.ModuleSkill.LISTENING,
				com.english_hub.core.modules.module.domain.model.ModuleTaskType.QUIZ,
				3,
				"Listen carefully",
				new BigDecimal("12.50"),
				"modules/7/audio/source.mp3",
				42,
				"audio/mpeg",
				ModuleUploadStatus.READY,
				"Grade listening"));
	}

	@Test
	void mapsDomainToNewEntityIncludingAllFields() {
		Module source = module(
				42L,
				ModuleUploadStatus.FAILED,
				"modules/42/audio/source.wav",
				19,
				"audio/wav");

		AssignmentModule result = mapper.toNewEntity(source);

		assertThat(result.getId()).isNull();
		assertThat(result.getAssignmentId()).isEqualTo(42L);
		assertThat(result.getSkill()).isEqualTo(ModuleSkill.LISTENING);
		assertThat(result.getTaskType()).isEqualTo(ModuleTaskType.QUIZ);
		assertThat(result.getOrderIndex()).isEqualTo(4);
		assertThat(result.getInstructions()).isEqualTo("Instructions");
		assertThat(result.getMaxScore()).isEqualByComparingTo("15.00");
		assertThat(result.getSourceAudioStorageKey()).isEqualTo("modules/42/audio/source.wav");
		assertThat(result.getSourceAudioDurationSeconds()).isEqualTo(19);
		assertThat(result.getSourceAudioMimeType()).isEqualTo("audio/wav");
		assertThat(result.getSourceAudioUploadStatus()).isEqualTo(UploadStatus.FAILED);
		assertThat(result.getAiInstruction()).isEqualTo("AI instruction");
	}

	@Test
	void updatesDetailsAndAudioMetadataOnExistingEntity() {
		AssignmentModule target = new AssignmentModule(
				42L,
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Old instructions",
				BigDecimal.TEN,
				"modules/42/audio/old.mp3",
				10,
				"audio/mpeg",
				UploadStatus.PROCESSING,
				"Old AI instruction");
		Module source = module(
				42L,
				ModuleUploadStatus.READY,
				"modules/42/audio/new.mp3",
				25,
				"audio/mpeg");

		mapper.updateEntity(target, source);

		assertThat(target.getOrderIndex()).isEqualTo(4);
		assertThat(target.getInstructions()).isEqualTo("Instructions");
		assertThat(target.getMaxScore()).isEqualByComparingTo("15.00");
		assertThat(target.getAiInstruction()).isEqualTo("AI instruction");
		assertThat(target.getSourceAudioStorageKey()).isEqualTo("modules/42/audio/new.mp3");
		assertThat(target.getSourceAudioDurationSeconds()).isEqualTo(25);
		assertThat(target.getSourceAudioMimeType()).isEqualTo("audio/mpeg");
		assertThat(target.getSourceAudioUploadStatus()).isEqualTo(UploadStatus.READY);
		assertThat(target.getSkill()).isEqualTo(ModuleSkill.READING);
		assertThat(target.getTaskType()).isEqualTo(ModuleTaskType.QUIZ);
	}

	private Module module(
			Long assignmentId,
			ModuleUploadStatus uploadStatus,
			String storageKey,
			Integer durationSeconds,
			String mimeType) {
		return new Module(
				null,
				assignmentId,
				com.english_hub.core.modules.module.domain.model.ModuleSkill.LISTENING,
				com.english_hub.core.modules.module.domain.model.ModuleTaskType.QUIZ,
				4,
				"Instructions",
				new BigDecimal("15.00"),
				storageKey,
				durationSeconds,
				mimeType,
				uploadStatus,
				"AI instruction");
	}
}
