package com.english_hub.core.modules.classroom.presentation.rest;

import com.english_hub.core.modules.classroom.application.command.CreateClassCommand;
import com.english_hub.core.modules.classroom.application.command.UpdateClassCommand;
import com.english_hub.core.modules.classroom.application.service.ClassService;
import com.english_hub.core.modules.classroom.domain.model.ClassPage;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassDetailResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassListResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.ClassSummaryResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.CreateClassRequest;
import com.english_hub.core.modules.classroom.presentation.rest.dto.CreatedClassResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.PaginationResponse;
import com.english_hub.core.modules.classroom.presentation.rest.dto.UpdateClassRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/classes")
public class ClassController {

	private final ClassService classService;

	public ClassController(ClassService classService) {
		this.classService = classService;
	}

	@GetMapping
	public ResponseEntity<ClassListResponse> listClasses(
			@RequestParam(required = false) String status,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		ClassPage result = classService.listClasses(status, page, limit);
		ClassListResponse response = new ClassListResponse(
				result.classes().stream().map(ClassSummaryResponse::from).toList(),
				new PaginationResponse(result.page(), result.limit(), result.total()));
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ClassDetailResponse> getClassDetail(@PathVariable long id) {
		return ResponseEntity.ok(ClassDetailResponse.from(classService.getClassDetail(id)));
	}

	@PostMapping
	public ResponseEntity<CreatedClassResponse> createClass(@RequestBody CreateClassRequest request) {
		long id = classService.createClass(new CreateClassCommand(
				request.name(),
				request.level(),
				request.description(),
				request.startDate(),
				request.endDate(),
				request.teacherId()));
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new CreatedClassResponse("Tạo lớp thành công.", id));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> updateClass(
			@PathVariable long id,
			@RequestBody UpdateClassRequest request) {
		classService.updateClass(id, new UpdateClassCommand(
				request.name(),
				request.level(),
				request.description(),
				request.endDate(),
				request.status(),
				request.teacherId()));
		return ResponseEntity.ok(new MessageResponse("Cập nhật lớp học thành công."));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> deleteClass(@PathVariable long id) {
		classService.deleteClass(id);
		return ResponseEntity.ok(new MessageResponse("Xoá lớp học thành công."));
	}
}