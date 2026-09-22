package com.english_hub.core.modules.submission.presentation.rest;

import com.english_hub.core.modules.submission.application.service.SubmissionService;
import com.english_hub.core.modules.submission.presentation.rest.dto.StartSubmissionResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
}