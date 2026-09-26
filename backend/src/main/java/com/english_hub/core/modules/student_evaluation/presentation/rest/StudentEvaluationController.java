package com.english_hub.core.modules.student_evaluation.presentation.rest;

import com.english_hub.core.modules.student_evaluation.application.service.StudentEvaluationService;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationPage;
import com.english_hub.core.modules.student_evaluation.presentation.rest.dto.CreateStudentEvaluationRequest;
import com.english_hub.core.modules.student_evaluation.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.student_evaluation.presentation.rest.dto.PaginationResponse;
import com.english_hub.core.modules.student_evaluation.presentation.rest.dto.StudentEvaluationListResponse;
import com.english_hub.core.modules.student_evaluation.presentation.rest.dto.StudentEvaluationResponse;
import com.english_hub.core.modules.student_evaluation.presentation.rest.dto.UpdateStudentEvaluationRequest;
import java.util.List;
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
@RequestMapping("/api/v1")
public class StudentEvaluationController {

	private final StudentEvaluationService studentEvaluationService;

	public StudentEvaluationController(StudentEvaluationService studentEvaluationService) {
		this.studentEvaluationService = studentEvaluationService;
	}

	@GetMapping("/students/{id}/evaluations")
	public ResponseEntity<StudentEvaluationListResponse> listForStudent(
			@PathVariable long id,
			@RequestParam(required = false) Long classId,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		StudentEvaluationPage result = studentEvaluationService.listForStudent(id, classId, page, limit);
		List<StudentEvaluationListResponse.Item> data = result.getContent().stream()
				.map(StudentEvaluationListResponse.Item::from)
				.toList();
		return ResponseEntity.ok(new StudentEvaluationListResponse(
				data,
				new PaginationResponse(result.getPage(), result.getSize(), result.getTotalElements())));
	}

	@PostMapping("/students/{id}/evaluations")
	public ResponseEntity<MessageResponse> createForStudent(
			@PathVariable long id,
			@RequestBody CreateStudentEvaluationRequest request) {
		Long evaluationId = studentEvaluationService.createForStudent(id, request == null ? null : request.toCommand());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new MessageResponse("Đã lưu đánh giá.", evaluationId));
	}

	@GetMapping("/evaluations/{id}")
	public ResponseEntity<StudentEvaluationResponse> getById(@PathVariable long id) {
		return ResponseEntity.ok(StudentEvaluationResponse.from(studentEvaluationService.getById(id)));
	}

	@PutMapping("/evaluations/{id}")
	public ResponseEntity<MessageResponse> update(
			@PathVariable long id,
			@RequestBody UpdateStudentEvaluationRequest request) {
		studentEvaluationService.update(id, request == null ? null : request.toCommand());
		return ResponseEntity.ok(new MessageResponse("Cập nhật đánh giá thành công."));
	}

	@DeleteMapping("/evaluations/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable long id) {
		studentEvaluationService.delete(id);
		return ResponseEntity.ok(new MessageResponse("Đã xoá đánh giá."));
	}
}
