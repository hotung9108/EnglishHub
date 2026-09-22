package com.english_hub.core.modules.module.presentation.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.modules.module.application.command.CreateModuleCommand;
import com.english_hub.core.modules.module.application.command.UpdateModuleCommand;
import com.english_hub.core.modules.module.application.service.ModuleService;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.module.presentation.rest.dto.CreateModuleRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.UpdateModuleRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ModuleControllerTest {

	@Mock
	private ModuleService moduleService;

	private ModuleController moduleController;

	@BeforeEach
	void setUp() {
		moduleController = new ModuleController(moduleService);
	}

	@Test
	void mapsListResponseWithOrderAndScore() {
		when(moduleService.listModules(5L)).thenReturn(List.of(module(9L, ModuleSkill.READING, 1)));

		var response = moduleController.listModules(5L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().data()).hasSize(1);
		assertThat(response.getBody().data().getFirst().orderIndex()).isEqualTo(1);
		assertThat(response.getBody().data().getFirst().maxScore()).isEqualByComparingTo(BigDecimal.TEN);
	}

	@Test
	void mapsCreateResponse() {
		when(moduleService.createModule(5L, new CreateModuleCommand(
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Read",
				null,
				BigDecimal.TEN))).thenReturn(9L);

		var response = moduleController.createModule(5L, new CreateModuleRequest(
				ModuleSkill.READING,
				ModuleTaskType.QUIZ,
				1,
				"Read",
				null,
				BigDecimal.TEN));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody().id()).isEqualTo(9L);
		assertThat(response.getBody().message()).isEqualTo("Thêm module thành công.");
	}

	@Test
	void mapsDetailResponse() {
		when(moduleService.getModule(9L)).thenReturn(module(9L, ModuleSkill.LISTENING, 2));

		var response = moduleController.getModule(9L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().skill()).isEqualTo("LISTENING");
		assertThat(response.getBody().taskType()).isEqualTo("QUIZ");
	}

	@Test
	void mapsUpdateAndDeleteResponses() {
		var updateRequest = new UpdateModuleRequest("Updated", "AI", BigDecimal.valueOf(20), 2);

		var updateResponse = moduleController.updateModule(9L, updateRequest);
		var deleteResponse = moduleController.deleteModule(9L);

		assertThat(updateResponse.getBody().message()).isEqualTo("Cập nhật module thành công.");
		assertThat(deleteResponse.getBody().message()).isEqualTo("Đã xoá module.");
		verify(moduleService).updateModule(9L, new UpdateModuleCommand("Updated", "AI", BigDecimal.valueOf(20), 2));
		verify(moduleService).deleteModule(9L);
	}

	@Test
	void mapsAudioUploadResponse() {
		MockMultipartFile file = new MockMultipartFile(
				"file", "source.mp3", "audio/mpeg", new byte[] {'I', 'D', '3'});
		when(moduleService.uploadAudio(9L, file))
				.thenReturn(new ModuleService.AudioUploadResult("modules/9/audio/source.mp3", "PROCESSING"));

		var response = moduleController.uploadAudio(9L, file);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().sourceAudioStorageKey()).isEqualTo("modules/9/audio/source.mp3");
		assertThat(response.getBody().sourceAudioUploadStatus()).isEqualTo("PROCESSING");
	}

	private Module module(Long id, ModuleSkill skill, int orderIndex) {
		return new Module(
				id,
				5L,
				skill,
				ModuleTaskType.QUIZ,
				orderIndex,
				"Instructions",
				BigDecimal.TEN,
				null,
				null,
				null,
				null,
				null);
	}
}
