package com.english_hub.core.modules.submission.presentation.rest;

import com.english_hub.core.modules.submission.application.service.SubmissionService;
import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerPayload;
import com.english_hub.core.modules.submission.application.service.SubmissionService.AnswerResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.GradingDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.GradingSummaryResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleEntry;
import com.english_hub.core.modules.submission.application.service.SubmissionService.ModuleSummaryResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionDetailResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionListItemResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionListResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmissionStartResult;
import com.english_hub.core.modules.submission.application.service.SubmissionService.SubmitModuleResult;
import com.english_hub.core.modules.submission.domain.model.GradingMethod;
import com.english_hub.core.modules.submission.domain.model.GradingStatus;
import com.english_hub.core.modules.submission.domain.model.ModuleSkill;
import com.english_hub.core.modules.submission.domain.model.ModuleTaskType;
import com.english_hub.core.modules.submission.domain.model.SubmissionStatus;
import com.english_hub.core.modules.submission.presentation.rest.dto.StartSubmissionResponse;
import com.english_hub.core.modules.submission.presentation.rest.dto.SubmissionDetailResponse;
import com.english_hub.core.modules.submission.presentation.rest.dto.SubmissionListResponse;
import com.english_hub.core.modules.submission.presentation.rest.dto.SubmitModuleRequest;
import com.english_hub.core.modules.submission.presentation.rest.dto.SubmitModuleResponse;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
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

	@Test
	void mapsTheDetailResultToAnOkResponse() {
		SubmissionDetailResult result = new SubmissionDetailResult(
				88L,
				5L,
				41L,
				1,
				SubmissionStatus.GRADED,
				OffsetDateTime.parse("2026-09-22T09:00:00+07:00"),
				Instant.parse("2026-09-22T08:00:00Z"),
				List.of(new ModuleDetailResult(
						150L,
						9L,
						ModuleSkill.LISTENING,
						ModuleTaskType.QUIZ,
						SubmissionStatus.GRADED,
						new GradingDetailResult(
								77L,
								GradingMethod.AUTO,
								GradingStatus.COMPLETED,
								BigDecimal.valueOf(8),
								BigDecimal.TEN,
								null,
								null))));
		when(submissionService.getById(88L)).thenReturn(result);

		ResponseEntity<SubmissionDetailResponse> response = submissionController.getSubmission(88L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		SubmissionDetailResponse body = response.getBody();
		assertThat(body.id()).isEqualTo(88L);
		assertThat(body.assignmentId()).isEqualTo(5L);
		assertThat(body.studentId()).isEqualTo(41L);
		assertThat(body.status()).isEqualTo("GRADED");
		assertThat(body.submittedAt()).isEqualTo(OffsetDateTime.parse("2026-09-22T09:00:00+07:00"));
		assertThat(body.createdAt()).isEqualTo(Instant.parse("2026-09-22T08:00:00Z"));
		assertThat(body.modules()).hasSize(1);
		assertThat(body.modules().getFirst().moduleId()).isEqualTo(9L);
		assertThat(body.modules().getFirst().skill()).isEqualTo("LISTENING");
		assertThat(body.modules().getFirst().taskType()).isEqualTo("QUIZ");
		assertThat(body.modules().getFirst().grading().method()).isEqualTo("AUTO");
		assertThat(body.modules().getFirst().grading().status()).isEqualTo("COMPLETED");
		assertThat(body.modules().getFirst().grading().finalScore()).isEqualByComparingTo("8");
		assertThat(body.modules().getFirst().grading().maxScoreSnapshot()).isEqualByComparingTo("10");
	}

	@Test
	void mapsTheListResultToAnOkResponseWithPagination() {
		SubmissionListResult result = new SubmissionListResult(
				1,
				20,
				1,
				List.of(new SubmissionListItemResult(
						88L,
						41L,
						1,
						SubmissionStatus.GRADED,
						OffsetDateTime.parse("2026-09-22T09:00:00+07:00"),
						List.of(new ModuleSummaryResult(
								150L,
								9L,
								ModuleSkill.LISTENING,
								ModuleTaskType.QUIZ,
								SubmissionStatus.GRADED,
								new GradingSummaryResult(BigDecimal.valueOf(8), BigDecimal.TEN, GradingStatus.COMPLETED))))));
		when(submissionService.list(5L, 41L, "GRADED", 2, 10)).thenReturn(result);

		ResponseEntity<SubmissionListResponse> response = submissionController.listSubmissions(5L, 41L, "GRADED", 2, 10);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		SubmissionListResponse body = response.getBody();
		assertThat(body.pagination().page()).isEqualTo(1);
		assertThat(body.pagination().limit()).isEqualTo(20);
		assertThat(body.pagination().total()).isEqualTo(1);
		assertThat(body.data()).hasSize(1);
		assertThat(body.data().getFirst().studentId()).isEqualTo(41L);
		assertThat(body.data().getFirst().status()).isEqualTo("GRADED");
		assertThat(body.data().getFirst().modules().getFirst().grading().finalScore()).isEqualByComparingTo("8");
		assertThat(body.data().getFirst().modules().getFirst().grading().status()).isEqualTo("COMPLETED");
	}

	@Test
	void mapsTheSubmitModuleResultToAnOkResponse() {
		JsonNode content = new JsonMapper().readTree("{\"selectedOptionIds\":[1]}");
		SubmitModuleResult result = new SubmitModuleResult(
				"Đã nộp phần làm bài.",
				150L,
				SubmissionStatus.SUBMITTED,
				List.of(new AnswerResult(340L, 21L, content)));
		when(submissionService.submitModule(eq(150L), anyList())).thenReturn(result);

		ResponseEntity<SubmitModuleResponse> response = submissionController.submitModule(
				150L,
				new SubmitModuleRequest(List.of(new SubmitModuleRequest.AnswerPayload(21L, content))));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		SubmitModuleResponse body = response.getBody();
		assertThat(body.message()).isEqualTo("Đã nộp phần làm bài.");
		assertThat(body.submissionModuleId()).isEqualTo(150L);
		assertThat(body.status()).isEqualTo("SUBMITTED");
		assertThat(body.answers()).hasSize(1);
		assertThat(body.answers().getFirst().id()).isEqualTo(340L);
		assertThat(body.answers().getFirst().questionId()).isEqualTo(21L);
		assertThat(body.answers().getFirst().content().get("selectedOptionIds").get(0).asInt()).isEqualTo(1);
	}
}