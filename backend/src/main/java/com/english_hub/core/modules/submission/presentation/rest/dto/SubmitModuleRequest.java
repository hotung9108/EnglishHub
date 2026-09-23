package com.english_hub.core.modules.submission.presentation.rest.dto;

import java.util.List;

import tools.jackson.databind.JsonNode;

public record SubmitModuleRequest(List<AnswerPayload> answers) {

	public record AnswerPayload(Long questionId, JsonNode content) {
	}
}