package com.english_hub.core.modules.grading.presentation.rest;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.english_hub.core.modules.grading.application.service.GradingService;
import com.english_hub.core.common.ApiException;
import com.english_hub.core.common.GlobalExceptionHandler;
import com.english_hub.core.modules.grading.domain.model.GradingPage;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class GradingControllerMockMvcTest {

	@Mock
	private GradingService gradingService;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(new GradingController(gradingService))
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	@Test
	void annotationListUsesEndpointSpecificUnpagedResponse() throws Exception {
		when(gradingService.listAnnotations(8L)).thenReturn(List.of());

		mockMvc.perform(get("/api/v1/answers/8/annotations").param("page", "9").param("size", "3"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").isArray())
				.andExpect(jsonPath("$.data").isEmpty())
				.andExpect(jsonPath("$.pagination").doesNotExist())
				.andExpect(jsonPath("$.meta").doesNotExist());

		verify(gradingService).listAnnotations(8L);
	}

	@Test
	void gradingListUsesTheExistingDataAndPaginationEnvelope() throws Exception {
		when(gradingService.listGradings(null, null, null, 2, 5))
				.thenReturn(new GradingPage(Collections.emptyList(), 2, 5, 11));

		mockMvc.perform(get("/api/v1/gradings").param("page", "2").param("limit", "5"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data").isArray())
				.andExpect(jsonPath("$.pagination.page").value(2))
				.andExpect(jsonPath("$.pagination.limit").value(5))
				.andExpect(jsonPath("$.pagination.total").value(11))
				.andExpect(jsonPath("$.meta").doesNotExist());
	}

	@Test
	void gradeValidationFailureUsesTheExistingErrorField() throws Exception {
		mockMvc.perform(put("/api/v1/gradings/4")
					.contentType("application/json")
					.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Điểm số không hợp lệ so với thang điểm tối đa."))
				.andExpect(jsonPath("$.message").doesNotExist());
	}

	@Test
	void serviceApiErrorUsesTheExistingErrorField() throws Exception {
		when(gradingService.listAnnotations(8L)).thenThrow(ApiException.forbidden("forbidden"));

		mockMvc.perform(get("/api/v1/answers/8/annotations"))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("forbidden"))
				.andExpect(jsonPath("$.message").doesNotExist());
	}

	@Test
	void aiAnalysisEndpointReturnsAccepted() throws Exception {
		mockMvc.perform(post("/api/v1/submission-modules/14/grading/ai-analyze"))
				.andExpect(status().isAccepted())
				.andExpect(jsonPath("$.message").value("Đã gửi yêu cầu phân tích, vui lòng chờ."));

		verify(gradingService).requestAiAnalysis(14L);
	}

	@Test
	void aiSuggestionEndpointReturnsOkWithAggregatedData() throws Exception {
		when(gradingService.getAiSuggestion(14L)).thenReturn(new com.english_hub.core.modules.grading.presentation.rest.dto.AiGradingSuggestionResponse(
				14L,
				1L,
				"WRITING",
				"AI_GRADED",
				java.math.BigDecimal.valueOf(7.0),
				java.math.BigDecimal.valueOf(9.0),
				"Good overall coherence.",
				null,
				null,
				List.of(),
				null,
				"benchmark/qa-21-deterministic",
				"mock",
				false,
				true,
				"AI đã hoàn tất gợi ý chấm điểm."
		));

		mockMvc.perform(get("/api/v1/submission-modules/14/grading/ai-suggestion"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.submissionModuleId").value(14))
				.andExpect(jsonPath("$.gradingId").value(1))
				.andExpect(jsonPath("$.skill").value("WRITING"))
				.andExpect(jsonPath("$.status").value("AI_GRADED"))
				.andExpect(jsonPath("$.suggestedScore").value(7.0))
				.andExpect(jsonPath("$.maxScore").value(9.0))
				.andExpect(jsonPath("$.aiFeedback").value("Good overall coherence."))
				.andExpect(jsonPath("$.modelUsed").value("benchmark/qa-21-deterministic"))
				.andExpect(jsonPath("$.providerUsed").value("mock"))
				.andExpect(jsonPath("$.canTriggerAi").value(false))
				.andExpect(jsonPath("$.fallbackManualGradingAvailable").value(true));

		verify(gradingService).getAiSuggestion(14L);
	}
}
