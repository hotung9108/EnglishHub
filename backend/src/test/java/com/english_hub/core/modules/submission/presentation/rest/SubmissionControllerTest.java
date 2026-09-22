package com.english_hub.core.modules.submission.presentation.rest;

import com.english_hub.core.modules.submission.application.service.SubmissionService;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleEntry;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionStartResult;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.presentation.rest.dto.StartSubmissionResponse;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmissionControllerTest {

	@Mock
	private SubmissionService submissionService;

	private SubmissionController submissionController;

	@BeforeEach
	void setUp() {
		submissionController = new SubmissionController(submissionService);
	}

	@Test
	void mapsTheStartAttemptResultToACreatedResponse() {
		SubmissionStartResult result = new SubmissionStartResult(
				88L,
				5L,
				1,
				SubmissionStatus.IN_PROGRESS,
				Instant.parse("2026-09-22T08:00:00Z"),
				List.of(new ModuleEntry(150L, 9L, ModuleSkill.LISTENING, SubmissionStatus.IN_PROGRESS)));
		when(submissionService.startAttempt(5L)).thenReturn(result);

		ResponseEntity<StartSubmissionResponse> response = submissionController.startSubmission(5L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		StartSubmissionResponse body = response.getBody();
		assertThat(body.id()).isEqualTo(88L);
		assertThat(body.assignmentId()).isEqualTo(5L);
		assertThat(body.attemptNumber()).isEqualTo(1);
		assertThat(body.status()).isEqualTo("IN_PROGRESS");
		assertThat(body.createdAt()).isEqualTo(Instant.parse("2026-09-22T08:00:00Z"));
		assertThat(body.modules()).hasSize(1);
		assertThat(body.modules().getFirst().id()).isEqualTo(150L);
		assertThat(body.modules().getFirst().moduleId()).isEqualTo(9L);
		assertThat(body.modules().getFirst().skill()).isEqualTo("LISTENING");
		assertThat(body.modules().getFirst().status()).isEqualTo("IN_PROGRESS");
	}
}