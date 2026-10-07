package com.english_hub.core.modules.student_evaluation.presentation.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record MessageResponse(String message, Long id) {

	public MessageResponse(String message) {
		this(message, null);
	}
}
