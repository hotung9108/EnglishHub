package com.english_hub.core.modules.assignment.presentation.rest.dto;

import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

public final class MaxSubmissionsDeserializer extends ValueDeserializer<Integer> {

	@Override
	public Integer deserialize(JsonParser parser, DeserializationContext context) {
		if (parser.hasToken(JsonToken.VALUE_NUMBER_FLOAT)) {
			return context.reportInputMismatch(Integer.class, "maxSubmissions must be an integer");
		}
		return context.readValue(parser, Integer.class);
	}
}
