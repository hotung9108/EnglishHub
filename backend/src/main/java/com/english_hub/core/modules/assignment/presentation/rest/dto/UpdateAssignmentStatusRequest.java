package com.english_hub.core.modules.assignment.presentation.rest.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAssignmentStatusRequest(
		@NotBlank(message = "Không thể chuyển sang trạng thái này.")
		String status) {
}
