package com.english_hub.core.modules.assignment.presentation.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.modules.assignment.application.command.CreateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentCommand;
import com.english_hub.core.modules.assignment.application.command.UpdateAssignmentStatusCommand;
import com.english_hub.core.modules.assignment.application.service.AssignmentService;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentModuleSummary;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.presentation.rest.dto.AssignmentDetailResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.AssignmentListResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.CreateAssignmentRequest;
import com.english_hub.core.modules.assignment.presentation.rest.dto.CreatedAssignmentResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.assignment.presentation.rest.dto.UpdateAssignmentRequest;
import com.english_hub.core.modules.assignment.presentation.rest.dto.UpdateAssignmentStatusRequest;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class AssignmentControllerTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");

	@Mock
	private AssignmentService assignmentService;

	private AssignmentController assignmentController;

	@BeforeEach
	void setUp() {
		assignmentController = new AssignmentController(assignmentService);
	}

	@Test
	void mapsAssignmentListAndPagination() {
		when(assignmentService.listAssignments("PUBLISHED", 3L, 1, 20))
				.thenReturn(new AssignmentPage(List.of(assignment(5L, AssignmentStatus.PUBLISHED)), 1, 20, 4));

		ResponseEntity<AssignmentListResponse> response =
				assignmentController.listAssignments(3L, "PUBLISHED", 1, 20);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().data()).hasSize(1);
		assertThat(response.getBody().data().getFirst().id()).isEqualTo(5L);
		assertThat(response.getBody().data().getFirst().status()).isEqualTo("PUBLISHED");
		assertThat(response.getBody().pagination().total()).isEqualTo(4);
	}

	@Test
	void mapsCreateResponseAndStatus() {
		CreateAssignmentRequest request = new CreateAssignmentRequest(
				"Weekly Test 1", "Instructions", OPEN_AT, CLOSE_AT, 2);
		when(assignmentService.createAssignment(3L, new CreateAssignmentCommand(
				"Weekly Test 1", "Instructions", OPEN_AT, CLOSE_AT, 2))).thenReturn(5L);

		ResponseEntity<CreatedAssignmentResponse> response =
				assignmentController.createAssignment(3L, request);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody()).isEqualTo(new CreatedAssignmentResponse("Tạo bài tập thành công.", 5L));
	}

	@Test
	void mapsAssignmentDetailAndModuleSummaries() {
		when(assignmentService.getAssignmentDetail(5L)).thenReturn(
				new AssignmentService.AssignmentDetailResult(
						assignment(5L, AssignmentStatus.PUBLISHED),
						List.of(new AssignmentModuleSummary(9L, "READING"))));

		ResponseEntity<AssignmentDetailResponse> response = assignmentController.getAssignmentDetail(5L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().id()).isEqualTo(5L);
		assertThat(response.getBody().modules()).hasSize(1);
		assertThat(response.getBody().modules().getFirst().skill()).isEqualTo("READING");
	}

	@Test
	void mapsUpdateResponse() {
		UpdateAssignmentRequest request = new UpdateAssignmentRequest(
				"Updated", null, null, CLOSE_AT.plusDays(1), null);

		ResponseEntity<MessageResponse> response = assignmentController.updateAssignment(5L, request);

		verify(assignmentService).updateAssignment(5L, new UpdateAssignmentCommand(
				"Updated", null, null, CLOSE_AT.plusDays(1), null));
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Cập nhật bài tập thành công."));
	}

	@Test
	void mapsDeleteResponse() {
		ResponseEntity<MessageResponse> response = assignmentController.deleteAssignment(5L);

		verify(assignmentService).deleteAssignment(5L);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đã xoá bài tập."));
	}

	@Test
	void mapsPublishStatusResponse() {
		when(assignmentService.updateStatus(5L, new UpdateAssignmentStatusCommand("PUBLISHED")))
				.thenReturn(AssignmentStatus.PUBLISHED);

		ResponseEntity<MessageResponse> response = assignmentController.updateStatus(
				5L,
				new UpdateAssignmentStatusRequest("PUBLISHED"));

		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đã công bố bài tập."));
	}

	private Assignment assignment(Long id, AssignmentStatus status) {
		return new Assignment(
				id,
				3L,
				"Weekly Test 1",
				"Instructions",
				OPEN_AT,
				CLOSE_AT,
				2,
				status,
				false,
				null,
				null);
	}
}
