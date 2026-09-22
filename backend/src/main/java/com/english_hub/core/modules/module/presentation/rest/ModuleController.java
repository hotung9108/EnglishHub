package com.english_hub.core.modules.module.presentation.rest;

import com.english_hub.core.modules.module.application.command.CreateModuleCommand;
import com.english_hub.core.modules.module.application.command.UpdateModuleCommand;
import com.english_hub.core.modules.module.application.service.ModuleService;
import com.english_hub.core.modules.module.presentation.rest.dto.AudioUploadResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.CreateModuleRequest;
import com.english_hub.core.modules.module.presentation.rest.dto.CreatedModuleResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleDetailResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleListResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleMessageResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.ModuleSummaryResponse;
import com.english_hub.core.modules.module.presentation.rest.dto.UpdateModuleRequest;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

	@PostMapping(value = "/modules/{moduleId}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<AudioUploadResponse> uploadAudio(
			@PathVariable long moduleId,
			@RequestPart("file") MultipartFile file) {
		ModuleService.AudioUploadResult result = moduleService.uploadAudio(moduleId, file);
		return ResponseEntity.ok(new AudioUploadResponse(
				"Upload audio thành công.",
				result.storageKey(),
				result.uploadStatus()));
	}
}
