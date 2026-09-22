package com.english_hub.core.modules.question.presentation.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.english_hub.core.modules.question.application.command.CreateQuestionCommand;
import com.english_hub.core.modules.question.application.command.UpdateQuestionCommand;
import com.english_hub.core.modules.question.application.service.QuestionService;
import com.english_hub.core.modules.question.domain.model.Question;
import com.english_hub.core.modules.question.domain.model.QuestionType;
import com.english_hub.core.modules.question.presentation.rest.dto.CreateQuestionRequest;
import com.english_hub.core.modules.question.presentation.rest.dto.UpdateQuestionRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

@ExtendWith(MockitoExtension.class)
class QuestionControllerTest {

	@Mock
	private QuestionService questionService;

	private QuestionController questionController;

	@BeforeEach
	void setUp() {
		questionController = new QuestionController(questionService);
	}

	@Test
	void mapsTeacherQuestionListWithCorrectAnswer() {
		Question question = question(21L, QuestionType.MULTIPLE_CHOICE);
		when(questionService.listQuestions(9L))
				.thenReturn(new QuestionService.QuestionListResult(List.of(question), true));

		var response = questionController.listQuestions(9L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().data()).hasSize(1);
		assertThat(response.getBody().data().getFirst().correctAnswer()).containsKey("options");
	}

	@Test
	void omitsCorrectAnswerForStudentQuestionList() {
		Question question = question(21L, QuestionType.MULTIPLE_CHOICE);
		when(questionService.listQuestions(9L))
				.thenReturn(new QuestionService.QuestionListResult(List.of(question), false));

		var response = questionController.listQuestions(9L);

		assertThat(response.getBody().data().getFirst().correctAnswer()).isNull();
	}

	@Test
	void mapsCreateResponseAndRequest() {
		Map<String, Object> answer = multipleChoiceAnswer();
		when(questionService.createQuestion(9L, new CreateQuestionCommand(
				"Choose one", QuestionType.MULTIPLE_CHOICE, answer, BigDecimal.ONE, 1)))
				.thenReturn(21L);

		var response = questionController.createQuestion(
				9L,
				new CreateQuestionRequest("Choose one", QuestionType.MULTIPLE_CHOICE, answer, BigDecimal.ONE, 1));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody().id()).isEqualTo(21L);
		assertThat(response.getBody().message()).isEqualTo("Tạo câu hỏi thành công.");
}

	@Test
	void mapsDetailUpdateAndDeleteResponses() {
		Question question = question(21L, QuestionType.SHORT_ANSWER);
		when(questionService.getQuestion(21L)).thenReturn(new QuestionService.QuestionResult(question, true));
		var detailResponse = questionController.getQuestion(21L);

		var updateResponse = questionController.updateQuestion(
				21L,
				new UpdateQuestionRequest("Updated", null, BigDecimal.valueOf(2), 2));
		var deleteResponse = questionController.deleteQuestion(21L);

		assertThat(detailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(detailResponse.getBody().correctAnswer()).containsEntry("correctAnswer", "answer");
		assertThat(updateResponse.getBody().message()).isEqualTo("Cập nhật câu hỏi thành công.");
		assertThat(deleteResponse.getBody().message()).isEqualTo("Đã xoá câu hỏi.");
		verify(questionService).updateQuestion(
				21L,
				new UpdateQuestionCommand("Updated", null, BigDecimal.valueOf(2), 2));
		verify(questionService).deleteQuestion(21L);
	}

	private Question question(Long id, QuestionType type) {
		return new Question(
				id,
				9L,
				"Question",
				type,
				type == QuestionType.MULTIPLE_CHOICE
						? multipleChoiceAnswer()
						: Map.of("correctAnswer", "answer"),
				BigDecimal.ONE,
				1);
	}

	private Map<String, Object> multipleChoiceAnswer() {
		return Map.of(
				"options",
				List.of(
						Map.of("id", 1, "content", "A", "isCorrect", true),
						Map.of("id", 2, "content", "B", "isCorrect", false),
						Map.of("id", 3, "content", "C", "isCorrect", false),
						Map.of("id", 4, "content", "D", "isCorrect", false)));
	}
}
