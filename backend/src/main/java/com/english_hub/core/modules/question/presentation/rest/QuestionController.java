package com.english_hub.core.modules.question.presentation.rest;

import com.english_hub.core.modules.question.application.command.CreateQuestionCommand;
import com.english_hub.core.modules.question.application.command.UpdateQuestionCommand;
import com.english_hub.core.modules.question.application.service.QuestionService;
import com.english_hub.core.modules.question.presentation.rest.dto.CreatedQuestionResponse;
import com.english_hub.core.modules.question.presentation.rest.dto.CreateQuestionRequest;
import com.english_hub.core.modules.question.presentation.rest.dto.QuestionListResponse;
import com.english_hub.core.modules.question.presentation.rest.dto.QuestionMessageResponse;
import com.english_hub.core.modules.question.presentation.rest.dto.QuestionResponse;
import com.english_hub.core.modules.question.presentation.rest.dto.UpdateQuestionRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class QuestionController {

	private final QuestionService questionService;

	public QuestionController(QuestionService questionService) {
		this.questionService = questionService;
	}

	@GetMapping("/modules/{moduleId}/questions")
	public ResponseEntity<QuestionListResponse> listQuestions(@PathVariable long moduleId) {
		QuestionService.QuestionListResult result = questionService.listQuestions(moduleId);
		return ResponseEntity.ok(new QuestionListResponse(
				result.questions().stream()
						.map(question -> QuestionResponse.from(question, result.includeCorrectAnswer()))
						.toList()));
	}

	@PostMapping("/modules/{moduleId}/questions")
	public ResponseEntity<CreatedQuestionResponse> createQuestion(
				@PathVariable long moduleId,
				@Valid @RequestBody CreateQuestionRequest request) {
		long questionId = questionService.createQuestion(
				moduleId,
				new CreateQuestionCommand(
						request.content(),
						request.questionType(),
						request.correctAnswer(),
						request.score(),
						request.orderIndex()));
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(new CreatedQuestionResponse("Tạo câu hỏi thành công.", questionId));
	}

	@GetMapping("/questions/{questionId}")
	public ResponseEntity<QuestionResponse> getQuestion(@PathVariable long questionId) {
		QuestionService.QuestionResult result = questionService.getQuestion(questionId);
		return ResponseEntity.ok(QuestionResponse.from(result.question(), result.includeCorrectAnswer()));
	}

	@PutMapping("/questions/{questionId}")
	public ResponseEntity<QuestionMessageResponse> updateQuestion(
				@PathVariable long questionId,
				@Valid @RequestBody UpdateQuestionRequest request) {
		questionService.updateQuestion(
				questionId,
				new UpdateQuestionCommand(
						request.content(),
						request.correctAnswer(),
						request.score(),
						request.orderIndex()));
		return ResponseEntity.ok(new QuestionMessageResponse("Cập nhật câu hỏi thành công."));
	}

	@DeleteMapping("/questions/{questionId}")
	public ResponseEntity<QuestionMessageResponse> deleteQuestion(@PathVariable long questionId) {
		questionService.deleteQuestion(questionId);
		return ResponseEntity.ok(new QuestionMessageResponse("Đã xoá câu hỏi."));
	}
}
