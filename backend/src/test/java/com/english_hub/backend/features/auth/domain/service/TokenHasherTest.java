package com.english_hub.backend.features.auth.domain.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TokenHasherTest {

	@Test
	void producesTheKnownSha256Vector() {
		assertThat(TokenHasher.sha256("abc"))
				.isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
	}

	@Test
	void producesA64CharacterLowercaseHexDigest() {
		String hash = TokenHasher.sha256("some-refresh-token-value");

		assertThat(hash).hasSize(64).isLowerCase().matches("^[0-9a-f]+$");
	}

	@Test
	void isDeterministic() {
		assertThat(TokenHasher.sha256("refresh-token")).isEqualTo(TokenHasher.sha256("refresh-token"));
	}

	@Test
	void differsForDifferentInputs() {
		assertThat(TokenHasher.sha256("token-a")).isNotEqualTo(TokenHasher.sha256("token-b"));
	}
}