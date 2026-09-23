package com.english_hub.core.modules.assignment.presentation.rest;

import com.english_hub.core.modules.assignment.application.command.CreateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentStatusCommand;
import com.english_hub.core.modules.assignment.application.service.AssignmentService;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.presentation.rest.dto.AssignmentDetailResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.AssignmentListResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.AssignmentSummaryResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.CreatedAssignmentResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.CreateAssignmentRequest;
import com.english_hub.core.modules.assignment.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.PaginationResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.UpdateAssignmentRequest;
import com.english_hub.core.modules.assignment.presentation.rest.dto.UpdateAssignmentStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AssignmentController {

	private final AssignmentService assignmentService;

	public AssignmentController(AssignmentService assignmentService) {
		this.assignmentService = assignmentService;
	}

	@GetMapping("/classes/{classId}/assignments")
	public ResponseEntity<AssignmentListResponse> listAssignments(
			@PathVariable long classId,
			@RequestParam(required = false) String status,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		AssignmentPage result = assignmentService.listAssignments(status, classId, page, limit);
		return ResponseEntity.ok(new AssignmentListResponse(
				result.assignments().stream().map(AssignmentSummaryResponse::from).toList(),
				new PaginationResponse(result.page(), result.limit(), result.total())));
	}

	@PostMapping("/classes/{classId}/assignments")
	public ResponseEntity<CreatedAssignmentResponse> createAssignment(
			@PathVariable long classId,
			@Valid @RequestBody CreateAssignmentRequest request) {
		long id = assignmentService.createAssignment(classId, new CreateAssignmentCommand(
				request.title(),
				request.description(),
				request.openAt(),
				request.closeAt(),
				request.maxSubmissions()));
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new CreatedAssignmentResponse("Tạo bài tập thành công.", id));
	}

	@GetMapping("/assignments/{assignmentId}")
	public ResponseEntity<AssignmentDetailResponse> getAssignmentDetail(@PathVariable long assignmentId) {
		return ResponseEntity.ok(AssignmentDetailResponse.from(
				assignmentService.getAssignmentDetail(assignmentId)));
	}

	@PutMapping("/assignments/{assignmentId}")
	public ResponseEntity<MessageResponse> updateAssignment(
			@PathVariable long assignmentId,
			@Valid @RequestBody UpdateAssignmentRequest request) {
		assignmentService.updateAssignment(assignmentId, new UpdateAssignmentCommand(
				request.title(),
				request.description(),
				request.openAt(),
				request.closeAt(),
				request.maxSubmissions()));
		return ResponseEntity.ok(new MessageResponse("Cập nhật bài tập thành công."));
	}

	@DeleteMapping("/assignments/{assignmentId}")
	public ResponseEntity<MessageResponse> deleteAssignment(@PathVariable long assignmentId) {
		assignmentService.deleteAssignment(assignmentId);
		return ResponseEntity.ok(new MessageResponse("Đã xoá bài tập."));
	}

	@PatchMapping("/assignments/{assignmentId}/status")
	public ResponseEntity<MessageResponse> updateStatus(
			@PathVariable long assignmentId,
			@Valid @RequestBody UpdateAssignmentStatusRequest request) {
		AssignmentStatus status = assignmentService.updateStatus(
				assignmentId,
				new UpdateAssignmentStatusCommand(request.status()));
		return ResponseEntity.ok(new MessageResponse(statusMessage(status)));
	}

	private String statusMessage(AssignmentStatus status) {
		return status == AssignmentStatus.PUBLISHED
				? "Đã công bố bài tập."
				: "Đã đóng bài tập.";
	}
}
