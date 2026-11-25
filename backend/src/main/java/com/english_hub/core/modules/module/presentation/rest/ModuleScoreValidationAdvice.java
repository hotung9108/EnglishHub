package com.english_hub.core.modules.module.presentation.rest;

import com.english_hub.core.common.ApiError;
import java.util.List;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = ModuleController.class)
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ModuleScoreValidationAdvice {

	private static final List<String> MAX_SCORE_ERROR_PRIORITY = List.of("DecimalMin", "DecimalMax");

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleInvalidRequest(MethodArgumentNotValidException exception) {
		String message = maxScoreErrorMessage(exception);
		if (message == null) {
			message = exception.getBindingResult().getAllErrors().stream()
					.map(error -> error.getDefaultMessage())
					.filter(value -> value != null && !value.isBlank())
					.findFirst()
					.orElse("Dữ liệu không hợp lệ.");
		}
		return ResponseEntity.badRequest().body(new ApiError(message));
	}

	private String maxScoreErrorMessage(MethodArgumentNotValidException exception) {
		List<FieldError> errors = exception.getBindingResult().getFieldErrors("maxScore");
		for (String priorityCode : MAX_SCORE_ERROR_PRIORITY) {
			for (FieldError error : errors) {
				if (hasCode(error, priorityCode) && hasMessage(error)) {
					return error.getDefaultMessage();
				}
			}
		}
		return null;
	}

	private boolean hasCode(FieldError error, String expectedCode) {
		String[] codes = error.getCodes();
		if (codes == null) {
			return false;
		}
		for (String code : codes) {
			if (expectedCode.equals(code)) {
				return true;
			}
		}
		return false;
	}

	private boolean hasMessage(FieldError error) {
		String message = error.getDefaultMessage();
		return message != null && !message.isBlank();
	}
}
