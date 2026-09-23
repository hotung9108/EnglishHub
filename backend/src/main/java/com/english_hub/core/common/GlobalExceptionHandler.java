package com.english_hub.core.common;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<ApiError> handleApiException(ApiException exception) {
		return ResponseEntity.status(exception.getStatus()).body(new ApiError(exception.getMessage()));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiError> handleAccessDenied() {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(new ApiError("Bạn không có quyền thực hiện thao tác này."));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleInvalidRequest(MethodArgumentNotValidException exception) {
		String message = exception.getBindingResult().getAllErrors().stream()
				.map(error -> error.getDefaultMessage())
				.filter(value -> value != null && !value.isBlank())
				.findFirst()
				.orElse("Dữ liệu không hợp lệ.");
		return ResponseEntity.badRequest().body(new ApiError(message));
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch() {
		return ResponseEntity.badRequest().body(new ApiError("Dữ liệu không hợp lệ."));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableRequest() {
		return ResponseEntity.badRequest().body(new ApiError("Dữ liệu không hợp lệ."));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException exception) {
		if (containsDuplicateEmail(exception)) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
					.body(new ApiError("Email đã được sử dụng."));
		}
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("Lỗi máy chủ."));
	}

	@ExceptionHandler(DataAccessException.class)
	public ResponseEntity<ApiError> handleDatabaseError() {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("Lỗi máy chủ."));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleUnexpectedException(Exception exception, HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.body(new ApiError("Lỗi máy chủ."));
	}

	private boolean containsDuplicateEmail(DataIntegrityViolationException exception) {
		Throwable cause = exception;
		while (cause != null) {
			String message = cause.getMessage();
			if (message != null && (message.contains("uq_users_email") || message.contains("users_email_key"))) {
				return true;
			}
			cause = cause.getCause();
		}
		return false;
	}
}
