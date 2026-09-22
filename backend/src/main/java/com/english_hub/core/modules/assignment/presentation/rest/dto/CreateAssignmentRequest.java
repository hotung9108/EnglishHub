package com.english_hub.core.modules.assignment.presentation.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateAssignmentRequest(
		@NotBlank(message = "Dữ liệu không hợp lệ.")
		@Size(max = 200, message = "Dữ liệu không hợp lệ.")
		String title,
		String description,
		@NotNull(message = "Dữ liệu thời gian hoặc số lần nộp không hợp lệ.")
		OffsetDateTime openAt,
		@NotNull(message = "Dữ liệu thời gian hoặc số lần nộp không hợp lệ.")
		OffsetDateTime closeAt,
		@Positive(message = "Dữ liệu thời gian hoặc số lần nộp không hợp lệ.")
		Integer maxSubmissions) {
}
