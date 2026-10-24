package com.english_hub.core.modules.module.presentation.rest;

import com.english_hub.core.modules.module.application.command.CreateModuleCommand;
import com.english_hub.core.modules.module.application.command.UpdateModuleCommand;
import com.english_hub.core.modules.module.application.service.ModuleService;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadConfirmRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadConfirmResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadUrlRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadUrlResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.CreateModuleRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.CreatedModuleResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleDetailResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleListResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleMessageResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleSummaryResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.UpdateModuleRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ModuleController {

	private final ModuleService moduleService;

	public ModuleController(ModuleService moduleService) {
		this.moduleService = moduleService;
	}

	@GetMapping("/assignments/{assignmentId}/modules")
	public ResponseEntity<ModuleListResponse> listModules(@PathVariable long assignmentId) {
		List<ModuleSummaryResponse> modules = moduleService.listModules(assignmentId).stream()
				.map(ModuleSummaryResponse::from)
				.toList();
		return ResponseEntity.ok(new ModuleListResponse(modules));
	}

	@PostMapping("/assignments/{assignmentId}/modules")
	public ResponseEntity<CreatedModuleResponse> createModule(
			@PathVariable long assignmentId,
			@Valid @RequestBody CreateModuleRequest request) {
		long moduleId = moduleService.createModule(
				assignmentId,
				new CreateModuleCommand(
						request.skill(),
						request.taskType(),
						request.orderIndex(),
						request.instructions(),
						request.aiInstruction(),
						request.maxScore()));
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new CreatedModuleResponse("Thêm module thành công.", moduleId));
	}

	@GetMapping("/modules/{moduleId}")
	public ResponseEntity<ModuleDetailResponse> getModule(@PathVariable long moduleId) {
		return ResponseEntity.ok(ModuleDetailResponse.from(moduleService.getModule(moduleId)));
	}

	@PutMapping("/modules/{moduleId}")
	public ResponseEntity<ModuleMessageResponse> updateModule(
			@PathVariable long moduleId,
			@Valid @RequestBody UpdateModuleRequest request) {
		moduleService.updateModule(
				moduleId,
				new UpdateModuleCommand(
						request.instructions(),
						request.aiInstruction(),
						request.maxScore(),
						request.orderIndex()));
		return ResponseEntity.ok(new ModuleMessageResponse("Cập nhật module thành công."));
	}

	@DeleteMapping("/modules/{moduleId}")
	public ResponseEntity<ModuleMessageResponse> deleteModule(@PathVariable long moduleId) {
		moduleService.deleteModule(moduleId);
		return ResponseEntity.ok(new ModuleMessageResponse("Đã xoá module."));
	}

	@PostMapping(value = "/modules/{moduleId}/audio", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<AudioUploadUrlResponse> requestAudioUpload(
			@PathVariable long moduleId,
			@RequestBody AudioUploadUrlRequest request) {
		ModuleService.AudioUploadUrlResult result =
				moduleService.requestAudioUpload(moduleId, request == null ? null : request.mimeType());
		return ResponseEntity.ok(AudioUploadUrlResponse.of("Lấy link upload audio thành công.", result));
	}

	@PostMapping(value = "/modules/{moduleId}/audio/confirm", consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<AudioUploadConfirmResponse> confirmAudioUpload(
			@PathVariable long moduleId,
			@RequestBody AudioUploadConfirmRequest request) {
		ModuleService.AudioUploadConfirmResult result = moduleService.confirmAudioUpload(
				moduleId, request == null ? null : request.storageKey());
		String message = "READY".equals(result.uploadStatus())
				? "Xác nhận upload audio thành công."
				: "File audio chưa được tải lên kho lưu trữ.";
		return ResponseEntity.ok(new AudioUploadConfirmResponse(
				message,
				result.storageKey(),
				result.uploadStatus()));
	}

	@GetMapping("/modules/{moduleId}/audio")
	public ResponseEntity<byte[]> getModuleAudio(@PathVariable long moduleId) {
		ModuleService.ModuleAudioResult result = moduleService.getModuleAudio(moduleId);
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(result.mimeType()))
				.cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePrivate())
				.contentLength(result.bytes().length)
				.body(result.bytes());
	}
}
