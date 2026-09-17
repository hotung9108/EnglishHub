package com.english_hub.backend.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.junit.jupiter.api.Test;

class OpenApiConfigTest {

	private final OpenApiConfig openApiConfig = new OpenApiConfig();

	@Test
	void exposesASpecWithTheBearerJwtScheme() {
		var openApi = openApiConfig.englishHubOpenAPI();

		assertThat(openApi.getInfo().getTitle()).isEqualTo("EnglishHub API");
		SecurityScheme scheme = openApi.getComponents().getSecuritySchemes().get("bearerAuth");
		assertThat(scheme).isNotNull();
		assertThat(scheme.getType()).isEqualTo(SecurityScheme.Type.HTTP);
		assertThat(scheme.getScheme()).isEqualTo("bearer");
		assertThat(scheme.getBearerFormat()).isEqualTo("JWT");
	}

	@Test
	void requiresBearerAuthGloballyByDefault() {
		var openApi = openApiConfig.englishHubOpenAPI();

		assertThat(openApi.getSecurity()).hasSize(1);
		SecurityRequirement requirement = openApi.getSecurity().get(0);
		assertThat(requirement.get("bearerAuth")).isEmpty();
	}
}