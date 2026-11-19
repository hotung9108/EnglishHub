package com.english_hub.core.modules.assignment.presentation.rest.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import tools.jackson.databind.annotation.JsonDeserialize;

public record UpdateAssignmentRequest(
		@Size(max = 200, message = "Dữ liệu không hợp lệ.")
		String title,
		String description,
		OffsetDateTime openAt,
		OffsetDateTime closeAt,
		@JsonDeserialize(using = MaxSubmissionsDeserializer.class)
		@Positive(message = "Dữ liệu thời gian hoặc số lần nộp không hợp lệ.")
		Integer maxSubmissions) {
}
