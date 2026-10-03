package com.english_hub.core.modules.grading.domain.service;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Normalizes free-text answers before comparison: folds to NFC so precomposed and decomposed
 * Vietnamese text compare equal, trims, collapses internal whitespace runs and lowercases.
 *
 * <p>Punctuation is deliberately preserved because the teacher authored the expected answer
 * verbatim; only case and whitespace are treated as noise.
 */
public final class AnswerTextNormalizer {

	private AnswerTextNormalizer() {
	}

	public static String normalize(String value) {
		if (value == null || value.isBlank()) {
			return "";
		}
		return Normalizer.normalize(value, Normalizer.Form.NFC)
				.trim()
				.replaceAll("(?U)\\s+", " ")
				.toLowerCase(Locale.ROOT);
	}
}