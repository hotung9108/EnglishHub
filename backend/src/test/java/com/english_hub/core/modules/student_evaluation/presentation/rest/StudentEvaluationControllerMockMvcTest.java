package com.english_hub.core.modules.student_evaluation.presentation.rest;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.modules.student_evaluation.application.command.CreateStudentEvaluationCommand;
import com.english_hub.core.modules.student_evaluation.application.command.UpdateStudentEvaluationCommand;
import com.english_hub.core.modules.student_evaluation.application.service.StudentEvaluationService;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluation;
import com.english_hub.core.modules.student_evaluation.domain.model.StudentEvaluationPage;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class StudentEvaluationControllerMockMvcTest {

	@Mock
	private StudentEvaluationService studentEvaluationService;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(new StudentEvaluationController(studentEvaluationService))
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	@Test
	void listReturnsOnlyTheContractDataAndPaginationEnvelope() throws Exception {
		StudentEvaluation evaluation = new StudentEvaluation(
				8L, 3L, 4L, 5L, "Teacher A", "Progress", Instant.parse("2026-09-26T10:00:00Z"));
		when(studentEvaluationService.listForStudent(3L, 5L, 2, 7))
				.thenReturn(new StudentEvaluationPage(List.of(evaluation), 2, 7, 10));

		mockMvc.perform(get("/api/v1/students/3/evaluations")
					.param("classId", "5")
					.param("page", "2")
					.param("limit", "7"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data[0].id").value(8))
				.andExpect(jsonPath("$.data[0].classId").value(5))
				.andExpect(jsonPath("$.data[0].teacherName").value("Teacher A"))
				.andExpect(jsonPath("$.data[0].content").value("Progress"))
				.andExpect(jsonPath("$.data[0].createdAt").exists())
				.andExpect(jsonPath("$.data[0].studentId").doesNotExist())
				.andExpect(jsonPath("$.pagination.page").value(2))
				.andExpect(jsonPath("$.pagination.limit").value(7))
				.andExpect(jsonPath("$.pagination.total").value(10))
				.andExpect(jsonPath("$.meta").doesNotExist());
	}

	@Test
	void listUsesDefaultPageAndLimit() throws Exception {
		when(studentEvaluationService.listForStudent(3L, null, 1, 20))
				.thenReturn(new StudentEvaluationPage(List.of(), 1, 20, 0));

		mockMvc.perform(get("/api/v1/students/3/evaluations"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pagination.page").value(1))
				.andExpect(jsonPath("$.pagination.limit").value(20));

		verify(studentEvaluationService).listForStudent(3L, null, 1, 20);
	}

	@Test
	void createReturns201WithMessageAndId() throws Exception {
		when(studentEvaluationService.createForStudent(3L, new CreateStudentEvaluationCommand(5L, "Progress")))
				.thenReturn(8L);

		mockMvc.perform(post("/api/v1/students/3/evaluations")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"classId\":5,\"content\":\"Progress\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.message").value("Đã lưu đánh giá."))
				.andExpect(jsonPath("$.id").value(8));
	}

	@Test
	void detailResponseContainsOnlyIdAndContent() throws Exception {
		when(studentEvaluationService.getById(8L)).thenReturn(new StudentEvaluation(
				8L, 3L, 4L, 5L, "Teacher A", "Progress", Instant.parse("2026-09-26T10:00:00Z")));

		mockMvc.perform(get("/api/v1/evaluations/8"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(8))
				.andExpect(jsonPath("$.content").value("Progress"))
				.andExpect(jsonPath("$.classId").doesNotExist())
				.andExpect(jsonPath("$.teacherName").doesNotExist())
				.andExpect(jsonPath("$.createdAt").doesNotExist());
	}

	@Test
	void updateReturnsContractMessage() throws Exception {
		mockMvc.perform(put("/api/v1/evaluations/8")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"content\":\"Updated\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Cập nhật đánh giá thành công."))
				.andExpect(jsonPath("$.id").doesNotExist());

		verify(studentEvaluationService).update(8L, new UpdateStudentEvaluationCommand("Updated"));
	}

	@Test
	void deleteReturnsContractMessage() throws Exception {
		mockMvc.perform(delete("/api/v1/evaluations/8"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Đã xoá đánh giá."))
				.andExpect(jsonPath("$.id").doesNotExist());

		verify(studentEvaluationService).delete(8L);
	}

	@Test
	void serviceAuthorizationErrorUsesTheExistingErrorEnvelope() throws Exception {
		when(studentEvaluationService.getById(8L))
				.thenThrow(ApiException.forbidden("Bạn không có quyền thực hiện thao tác này."));

		mockMvc.perform(get("/api/v1/evaluations/8"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Bạn không có quyền thực hiện thao tác này."))
				.andExpect(jsonPath("$.message").doesNotExist());
	}

	@Test
	void missingAuthenticationUsesTheExisting401Contract() throws Exception {
		when(studentEvaluationService.getById(8L))
				.thenThrow(ApiException.unauthorized("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));

		mockMvc.perform(get("/api/v1/evaluations/8"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn."));
	}
}
