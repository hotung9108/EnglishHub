package com.english_hub.core.modules.assignment.presentation.rest.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.OffsetDateTime;

public record UpdateAssignmentStatusRequest(
		@NotBlank(message = "Không thể chuyển sang trạng thái này.")
		String status,
		OffsetDateTime closeAt) {
}
