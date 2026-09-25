package com.english_hub.core.modules.grading.presentation.rest;

import com.english_hub.core.modules.grading.application.service.GradingService;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import com.english_hub.core.modules.grading.presentation.rest.dto.AnswerAnnotationListResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.AnswerAnnotationResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.CreateAnswerAnnotationRequest;
import com.english_hub.core.modules.grading.presentation.rest.dto.CreatedAnswerAnnotationResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.GradingChangeLogListResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.GradingChangeLogResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.GradingDetailResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.GradingListResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.GradingMessageResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.GradingSummaryResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.PaginationResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.ReviewAnswerAnnotationRequest;
import com.english_hub.core.modules.grading.presentation.rest.dto.SubmissionModuleGradingResponse;
import com.english_hub.core.modules.grading.presentation.rest.dto.UpdateFinalGradeRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class GradingController {

	private final GradingService gradingService;

	public GradingController(GradingService gradingService) {
		this.gradingService = gradingService;
	}

	@GetMapping("/submission-modules/{id}/grading")
	public ResponseEntity<SubmissionModuleGradingResponse> getBySubmissionModule(@PathVariable long id) {
		return ResponseEntity.ok(SubmissionModuleGradingResponse.from(gradingService.getBySubmissionModuleId(id)));
	}

	@PostMapping("/submission-modules/{id}/grading/ai-analyze")
	public ResponseEntity<GradingMessageResponse> requestAiAnalysis(@PathVariable long id) {
		gradingService.requestAiAnalysis(id);
		return ResponseEntity.status(HttpStatus.ACCEPTED)
				.body(new GradingMessageResponse("Đã gửi yêu cầu phân tích, vui lòng chờ."));
	}

	@PutMapping("/gradings/{id}")
	public ResponseEntity<GradingMessageResponse> updateFinalGrade(
			@PathVariable long id,
			@Valid @RequestBody UpdateFinalGradeRequest request) {
		gradingService.updateFinalGrade(id, request.finalScore(), request.finalFeedback(), request.note());
		return ResponseEntity.ok(new GradingMessageResponse("Cập nhật điểm thành công."));
	}

	@GetMapping("/gradings/{id}")
	public ResponseEntity<GradingDetailResponse> getById(@PathVariable long id) {
		return ResponseEntity.ok(GradingDetailResponse.from(gradingService.getById(id)));
	}

	@GetMapping("/gradings")
	public ResponseEntity<GradingListResponse> listGradings(
			@RequestParam(required = false) Long classId,
			@RequestParam(required = false) Long studentId,
			@RequestParam(required = false) String status,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		GradingPage result = gradingService.listGradings(classId, studentId, status, page, limit);
		return ResponseEntity.ok(new GradingListResponse(
				result.getContent().stream().map(GradingSummaryResponse::from).toList(),
				new PaginationResponse(result.getPage(), result.getSize(), result.getTotalElements())));
	}

	@GetMapping("/answers/{id}/annotations")
	public ResponseEntity<AnswerAnnotationListResponse> listAnnotations(@PathVariable long id) {
		return ResponseEntity.ok(new AnswerAnnotationListResponse(
				gradingService.listAnnotations(id).stream().map(AnswerAnnotationResponse::from).toList()));
	}

	@PostMapping("/answers/{id}/annotations")
	public ResponseEntity<CreatedAnswerAnnotationResponse> createAnnotation(
			@PathVariable long id,
			@Valid @RequestBody CreateAnswerAnnotationRequest request) {
		Long annotationId = gradingService.createTeacherAnnotation(
				id,
				request.startOffset(),
				request.endOffset(),
				request.errorType(),
				request.comment(),
				request.suggestedFix());
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new CreatedAnswerAnnotationResponse("Đã thêm chú thích.", annotationId));
	}

	@PatchMapping("/annotations/{id}/review")
	public ResponseEntity<GradingMessageResponse> reviewAnnotation(
			@PathVariable long id,
			@Valid @RequestBody ReviewAnswerAnnotationRequest request) {
		gradingService.reviewAnnotation(id, request.reviewStatus());
		return ResponseEntity.ok(new GradingMessageResponse("Đã cập nhật trạng thái duyệt."));
	}

	@DeleteMapping("/annotations/{id}")
	public ResponseEntity<GradingMessageResponse> deleteAnnotation(@PathVariable long id) {
		gradingService.deleteAnnotation(id);
		return ResponseEntity.ok(new GradingMessageResponse("Đã xoá chú thích."));
	}

	@GetMapping("/gradings/{id}/change-logs")
	public ResponseEntity<GradingChangeLogListResponse> listChangeLogs(@PathVariable long id) {
		return ResponseEntity.ok(new GradingChangeLogListResponse(
				gradingService.listChangeLogs(id).stream().map(GradingChangeLogResponse::from).toList()));
	}
}
