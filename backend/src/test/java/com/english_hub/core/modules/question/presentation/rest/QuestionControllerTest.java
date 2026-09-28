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
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.MultipleChoiceCorrectAnswer;
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.MultipleChoiceCorrectAnswer.QuestionOption;
import com.english_hub.core.modules.question.presentation.rest.dto.correctanswer.ShortAnswerCorrectAnswer;
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
				new CreateQuestionRequest(
						"Choose one",
						QuestionType.MULTIPLE_CHOICE,
						new MultipleChoiceCorrectAnswer(options()),
						BigDecimal.ONE,
						1));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody().id()).isEqualTo(21L);
		assertThat(response.getBody().message()).isEqualTo("Tạo câu hỏi thành công.");
	}

	@Test
	void mapsShortAnswerCreateRequestToDomainMap() {
		Map<String, Object> answer = Map.of("correctAnswer", "English");
		when(questionService.createQuestion(9L, new CreateQuestionCommand(
				"Name a subject", QuestionType.SHORT_ANSWER, answer, BigDecimal.ONE, 2)))
				.thenReturn(22L);

		var response = questionController.createQuestion(
				9L,
				new CreateQuestionRequest(
						"Name a subject",
						QuestionType.SHORT_ANSWER,
						new ShortAnswerCorrectAnswer("English"),
						BigDecimal.ONE,
						2));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody().id()).isEqualTo(22L);
	}

	@Test
	void mapsUpdateCorrectAnswerToDomainMapAndKeepsOmittedAnswerNull() {
		questionController.updateQuestion(
				21L, new UpdateQuestionRequest(null, new ShortAnswerCorrectAnswer("English"), null, null));
		questionController.updateQuestion(21L, new UpdateQuestionRequest("Updated", null, null, null));

		verify(questionService).updateQuestion(21L, new UpdateQuestionCommand(
				null, Map.of("correctAnswer", "English"), null, null));
		verify(questionService).updateQuestion(21L, new UpdateQuestionCommand("Updated", null, null, null));
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
		return Map.of("options", options().stream().map(option -> Map.of(
				"id", option.id(),
				"content", option.content(),
				"isCorrect", option.isCorrect())).toList());
	}

	private List<QuestionOption> options() {
		return List.of(
				new QuestionOption(1, "A", true),
				new QuestionOption(2, "B", false),
				new QuestionOption(3, "C", false),
				new QuestionOption(4, "D", false));
	}
}
