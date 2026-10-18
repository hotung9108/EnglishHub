package com.english_hub.core.common;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.SQLException;
import java.util.List;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import tools.jackson.databind.exc.MismatchedInputException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	/**
	 * Leading phrases of the rejection messages raised by the typed payload deserializers, keyed by
	 * the contract they belong to. Kept as literals so this common-layer advice does not depend on
	 * any module's presentation package.
	 */
	private static final List<String> SHAPE_MESSAGE_PREFIXES =
			List.of("correctAnswer", "Nội dung câu trả lời");

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

	/**
	 * A missing or unsupported {@code Content-Type} header makes Spring reject the request body
	 * before it reaches the controller. Without this handler the catch-all {@code Exception}
	 * handler would report it as a 500, so map it to the correct 415 response instead.
	 */
	@ExceptionHandler(HttpMediaTypeNotSupportedException.class)
	public ResponseEntity<ApiError> handleUnsupportedMediaType() {
		return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
				.body(new ApiError("Định dạng nội dung không được hỗ trợ."));
	}

	/**
	 * Jackson wraps a rejected payload shape in {@code MismatchedInputException}, which Spring in
	 * turn wraps in {@code HttpMessageNotReadableException}. Surface the parser's own message only
	 * for the typed payload contracts (the question {@code correctAnswer} and the submission
	 * {@code content}) so the client learns which shape is expected, and keep the generic message
	 * for every other endpoint.
	 */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadableRequest(HttpMessageNotReadableException exception) {
		String detail = findShapeMessage(exception);
		if (detail != null) {
			return ResponseEntity.badRequest().body(new ApiError(detail));
		}
		return ResponseEntity.badRequest().body(new ApiError("Dữ liệu không hợp lệ."));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException exception) {
		String sqlState = extractSqlState(exception);
		String constraint = extractConstraintName(exception);
		String message = extractRootMessage(exception);

		boolean isUnique = (sqlState != null && "23505".equals(sqlState)) || isUniqueLike(message, constraint);
		if (isUnique) {
			return handleUniqueViolation(constraint, message);
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

	private String findShapeMessage(Throwable exception) {
		Throwable cause = exception;
		while (cause != null) {
			if (cause instanceof MismatchedInputException mismatch) {
				String message = mismatch.getOriginalMessage();
				if (message != null && SHAPE_MESSAGE_PREFIXES.stream().anyMatch(message::startsWith)) {
					return message;
				}
			}
			cause = cause.getCause();
		}
		return null;
	}

	private ResponseEntity<ApiError> handleUniqueViolation(String constraint, String message) {
		String lower = (constraint != null ? constraint.toLowerCase() : "");
		if (message != null && !message.isBlank()) {
			lower = lower + " " + message.toLowerCase();
		}

		if (lower.contains("uq_users_email") || lower.contains("users_email_key") || lower.contains("email")) {
			return conflict("Email đã được sử dụng.");
		}
		if (lower.contains("uq_submissions_assignment_student_attempt")
				|| lower.contains("submissions_assignment_student_attempt")) {
			return conflict("Đã tồn tại lượt nộp cho bài tập này.");
		}
		if (lower.contains("uq_modules_assignment_order") || lower.contains("modules_assignment_order")) {
			return conflict("Thứ tự module đã tồn tại trong bài tập này.");
		}
		if (lower.contains("uq_questions_module_order") || lower.contains("questions_module_order")) {
			return conflict("Thứ tự câu hỏi đã tồn tại trong module này.");
		}
		if (lower.contains("uq_submission_modules") || lower.contains("submission_modules_submission_module")
				|| lower.contains("submission_modules_submission") || lower.contains("submission_modules_module")) {
			return conflict("Module nộp đã tồn tại.");
		}
		if (lower.contains("unique") || lower.contains("duplicate key") || lower.contains("violates unique constraint")) {
			return conflict("Dữ liệu đã tồn tại.");
		}
		return conflict("Dữ liệu đã tồn tại.");
	}

	private ResponseEntity<ApiError> conflict(String message) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(message));
	}

	private String extractRootMessage(Throwable exception) {
		Throwable cause = exception;
		while (cause != null) {
			if (cause.getMessage() != null && !cause.getMessage().isBlank()) {
				return cause.getMessage();
			}
			cause = cause.getCause();
		}
		return null;
	}

	private String extractSqlState(Throwable exception) {
		Throwable cause = exception;
		while (cause != null) {
			if (cause instanceof SQLException sqlException) {
				String state = sqlException.getSQLState();
				if (state != null) {
					return state;
				}
			}
			cause = cause.getCause();
		}
		return null;
	}

	private String extractConstraintName(Throwable exception) {
		Throwable cause = exception;
		while (cause != null) {
			String message = cause.getMessage();
			if (message != null) {
				// Postgres format: ... constraint "uq_..." ...
				int idx = message.indexOf("constraint");
				if (idx >= 0) {
					String rest = message.substring(idx + "constraint".length());
					// remove spaces and quotes
					rest = rest.trim();
					if (rest.startsWith("\"")) {
						rest = rest.substring(1);
						int end = rest.indexOf('"');
						if (end >= 0) {
							return rest.substring(0, end);
						}
					}
				}
			}
			cause = cause.getCause();
		}
		return null;
	}

	private boolean isUniqueLike(String message, String constraint) {
		String lower = (constraint != null ? constraint.toLowerCase() : "");
		if (message != null) {
			lower = lower + " " + message.toLowerCase();
		}
		return lower.contains("unique") || lower.contains("duplicate key") || lower.contains("violates unique constraint");
	}
}
