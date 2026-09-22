package com.english_hub.core.infrastructure.persistence.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;

/**
 * Adapts the String-facing entity APIs to the Jackson 2 JsonNode type used by
 * Hibernate's default JSONB mapper. Jackson 3 JsonNode is intentionally not
 * used here because it failed during Hibernate JSONB persistence; existing
 * mappings such as Grading.aiTranscript remain outside this task.
 */
final class JsonbValueCodec {

	private static final ObjectMapper JSON_MAPPER = new ObjectMapper();

	private JsonbValueCodec() {
	}

	static JsonNode parse(String json, String fieldName) {
		if (json == null) {
			return null;
		}

		try {
			JsonNode parsed = JSON_MAPPER.readTree(json);
			if (parsed == null) {
				throw new IllegalArgumentException(fieldName + " must contain a JSON value");
			}
			return parsed;
		} catch (JsonProcessingException exception) {
			throw new IllegalArgumentException(fieldName + " must contain valid JSON", exception);
		}
	}

	static JsonNode text(String value) {
		return value == null ? null : JsonNodeFactory.instance.textNode(value);
	}

	static String serialize(JsonNode json) {
		return json == null ? null : json.toString();
	}
}
