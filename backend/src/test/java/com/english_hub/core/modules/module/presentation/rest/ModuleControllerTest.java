package com.english_hub.core.modules.module.presentation.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.modules.module.application.command.CreateModuleCommand;
import com.english_hub.core.modules.module.application.command.UpdateModuleCommand;
import com.english_hub.core.modules.module.application.service.ModuleService;
import com.english_hub.core.modules.module.domain.model.Module;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import com.english_hub.core.modules.module.domain.model.ModuleTaskType;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadConfirmRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadUrlRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.CreateModuleRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.UpdateModuleRequest;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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
	void mapsAudioUploadUrlResponse() {
		when(moduleService.requestAudioUpload(9L, "audio/mpeg"))
				.thenReturn(new ModuleService.AudioUploadUrlResult(
						"https://storage.example/presigned-put",
						"modules/9/audio/new.mp3",
						OffsetDateTime.parse("2026-10-01T00:00:00Z"),
						"UPLOADING"));

		var response = moduleController.requestAudioUpload(9L, new AudioUploadUrlRequest("audio/mpeg"));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().message()).isEqualTo("Lấy link upload audio thành công.");
		assertThat(response.getBody().uploadUrl()).isEqualTo("https://storage.example/presigned-put");
		assertThat(response.getBody().storageKey()).isEqualTo("modules/9/audio/new.mp3");
		assertThat(response.getBody().expiresAt()).isEqualTo(OffsetDateTime.parse("2026-10-01T00:00:00Z"));
		assertThat(response.getBody().sourceAudioUploadStatus()).isEqualTo("UPLOADING");
	}

	@Test
	void mapsAudioConfirmResponseForReadyAndFailedStatuses() {
		when(moduleService.confirmAudioUpload(9L, "modules/9/audio/new.mp3"))
				.thenReturn(new ModuleService.AudioUploadConfirmResult("modules/9/audio/new.mp3", "READY"));
		when(moduleService.confirmAudioUpload(9L, "modules/9/audio/missing.mp3"))
				.thenReturn(new ModuleService.AudioUploadConfirmResult("modules/9/audio/missing.mp3", "FAILED"));

		var ready = moduleController.confirmAudioUpload(9L, new AudioUploadConfirmRequest("modules/9/audio/new.mp3"));
		var failed = moduleController.confirmAudioUpload(9L, new AudioUploadConfirmRequest("modules/9/audio/missing.mp3"));

		assertThat(ready.getBody().message()).isEqualTo("Xác nhận upload audio thành công.");
		assertThat(ready.getBody().sourceAudioUploadStatus()).isEqualTo("READY");
		assertThat(failed.getBody().message()).isEqualTo("File audio chưa được tải lên kho lưu trữ.");
		assertThat(failed.getBody().sourceAudioUploadStatus()).isEqualTo("FAILED");
	}

	@Test
	void mapsAudioUploadUrlDatabaseFailureToServerError() throws Exception {
		when(moduleService.requestAudioUpload(eq(9L), any()))
				.thenThrow(new DataAccessResourceFailureException("metadata save failed"));
		MockMvc mockMvc = MockMvcBuilders.standaloneSetup(moduleController)
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();

		mockMvc.perform(post("/api/v1/modules/{moduleId}/audio", 9L)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"mimeType\":\"audio/mpeg\"}"))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.error").value("Lỗi máy chủ."));
	}

	@Test
	void mapsModuleAudioStreamingResponseWithMimeTypeAndCacheHeader() {
		when(moduleService.getModuleAudio(9L))
				.thenReturn(new ModuleService.ModuleAudioResult(new byte[] {1, 2, 3}, "audio/wav"));

		var response = moduleController.getModuleAudio(9L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.valueOf("audio/wav"));
		assertThat(response.getHeaders().getCacheControl()).contains("private");
		assertThat(response.getHeaders().getContentLength()).isEqualTo(3);
		assertThat(response.getBody()).containsExactly(1, 2, 3);
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
