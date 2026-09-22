package com.english_hub.core.modules.submission.presentation.rest;

import com.english_hub.core.modules.submission.application.service.SubmissionService;
import com.english_hub.core.modules.submission.presentation.rest.dto.StartSubmissionResponse;
import com.english_hub.core.modules.submission.presentation.rest.dto.SubmissionDetailResponse;
import com.english_hub.core.modules.submission.presentation.rest.dto.SubmissionListResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SubmissionController {

	private final SubmissionService submissionService;

	public SubmissionController(SubmissionService submissionService) {
		this.submissionService = submissionService;
	}

	@PostMapping("/assignments/{assignmentId}/submissions")
	public ResponseEntity<StartSubmissionResponse> startSubmission(@PathVariable long assignmentId) {
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(StartSubmissionResponse.from(submissionService.startAttempt(assignmentId)));
	}

	@GetMapping("/submissions/{id}")
	public ResponseEntity<SubmissionDetailResponse> getSubmission(@PathVariable long id) {
		return ResponseEntity.ok(SubmissionDetailResponse.from(submissionService.getById(id)));
	}

	@GetMapping("/submissions")
	public ResponseEntity<SubmissionListResponse> listSubmissions(
			@RequestParam(required = false) Long assignmentId,
			@RequestParam(required = false) Long studentId,
			@RequestParam(required = false) String status,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		return ResponseEntity.ok(
				SubmissionListResponse.from(submissionService.list(assignmentId, studentId, status, page, limit)));
	}
}