package com.english_hub.core.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.SQLException;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

/**
 * BUG-14 regression: every unique constraint violation must surface as 409 Conflict, not as a
 * generic 500 — previously only the duplicate-email constraint was recognized.
 */
class GlobalExceptionHandlerTest {

	private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

	@Test
	void uniqueViolationWithSqlState23505_mapsTo409() {
		SQLException cause = new SQLException(
				"ERROR: duplicate key value violates unique constraint \"uq_submissions_assignment_student_attempt\"",
				"23505");
		DataIntegrityViolationException exception = new DataIntegrityViolationException(
				"could not execute statement", cause);

		var response = handler.handleConflict(exception);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().error()).isEqualTo("Đã tồn tại lượt nộp cho bài tập này.");
	}

	@Test
	void duplicateEmailConstraint_stillMapsToEmailConflictMessage() {
		SQLException cause = new SQLException(
				"ERROR: duplicate key value violates unique constraint \"uq_users_email\"", "23505");
		DataIntegrityViolationException exception = new DataIntegrityViolationException(
				"could not execute statement", cause);

		var response = handler.handleConflict(exception);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().error()).isEqualTo("Email đã được sử dụng.");
	}

	@Test
	void unknownUniqueConstraint_mapsToGeneric409() {
		// No SQLState, no known constraint name — message-only detection.
		DataIntegrityViolationException exception = new DataIntegrityViolationException(
				"violates unique constraint \"some_future_uq\"");

		var response = handler.handleConflict(exception);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().error()).isEqualTo("Dữ liệu đã tồn tại.");
	}

	@Test
	void nonUniqueIntegrityViolation_stays500() {
		// FK violation (SQLState 23503) must not be misreported as a business conflict.
		SQLException cause = new SQLException(
				"ERROR: insert or update on table violates foreign key constraint", "23503");
		DataIntegrityViolationException exception = new DataIntegrityViolationException(
				"could not execute statement", cause);

		var response = handler.handleConflict(exception);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().error()).isEqualTo("Lỗi máy chủ.");
	}

	@Test
	void nestedCauseIsInspectedForSqlState() {
		SQLException cause = new SQLException(
				"ERROR: duplicate key value violates unique constraint \"uq_class_members_class_student\"",
				"23505");
		RuntimeException wrapper = new RuntimeException("wrap", cause);
		DataIntegrityViolationException exception = new DataIntegrityViolationException(
				"could not execute statement", wrapper);

		var response = handler.handleConflict(exception);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
	}
}
