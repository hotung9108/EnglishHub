package com.english_hub.core.infrastructure.persistence.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class AssignmentModuleTest {

	@Test
	void updateDetailsChangesOnlyModuleDetails() {
		AssignmentModule module = module();

		module.updateDetails(4, "Updated instructions", new BigDecimal("15.00"), "Updated AI instruction");

		assertThat(module.getOrderIndex()).isEqualTo(4);
		assertThat(module.getInstructions()).isEqualTo("Updated instructions");
		assertThat(module.getMaxScore()).isEqualByComparingTo("15.00");
		assertThat(module.getAiInstruction()).isEqualTo("Updated AI instruction");
		assertThat(module.getAssignmentId()).isEqualTo(42L);
		assertThat(module.getSkill()).isEqualTo(ModuleSkill.LISTENING);
		assertThat(module.getTaskType()).isEqualTo(ModuleTaskType.QUIZ);
		assertThat(module.getSourceAudioStorageKey()).isEqualTo("modules/42/audio/source.mp3");
		assertThat(module.getSourceAudioUploadStatus()).isEqualTo(UploadStatus.READY);
	}

	@Test
	void updateAudioMetadataChangesOnlyAudioFields() {
		AssignmentModule module = module();

		module.updateAudioMetadata("modules/42/audio/new.mp3", 25, "audio/mpeg", UploadStatus.FAILED);

		assertThat(module.getSourceAudioStorageKey()).isEqualTo("modules/42/audio/new.mp3");
		assertThat(module.getSourceAudioDurationSeconds()).isEqualTo(25);
		assertThat(module.getSourceAudioMimeType()).isEqualTo("audio/mpeg");
		assertThat(module.getSourceAudioUploadStatus()).isEqualTo(UploadStatus.FAILED);
		assertThat(module.getAssignmentId()).isEqualTo(42L);
		assertThat(module.getSkill()).isEqualTo(ModuleSkill.LISTENING);
		assertThat(module.getTaskType()).isEqualTo(ModuleTaskType.QUIZ);
		assertThat(module.getOrderIndex()).isEqualTo(2);
		assertThat(module.getInstructions()).isEqualTo("Instructions");
		assertThat(module.getMaxScore()).isEqualByComparingTo("10.00");
		assertThat(module.getAiInstruction()).isEqualTo("AI instruction");
	}

	private AssignmentModule module() {
		return new AssignmentModule(
				42L,
				ModuleSkill.LISTENING,
				ModuleTaskType.QUIZ,
				2,
				"Instructions",
				BigDecimal.TEN,
				"modules/42/audio/source.mp3",
				10,
				"audio/mpeg",
				UploadStatus.READY,
				"AI instruction");
	}
}
