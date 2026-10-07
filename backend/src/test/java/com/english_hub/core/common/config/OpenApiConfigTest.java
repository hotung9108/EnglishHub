package com.english_hub.core.common.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.junit.jupiter.api.Test;

class OpenApiConfigTest {

	private static final String SERVER_URL = "https://api-staging.hotung9108.me";
	private static final String SERVER_DESCRIPTION = "Staging (Cloudflare Tunnel)";

	private final OpenApiConfig openApiConfig = new OpenApiConfig();

	private OpenAPI buildOpenApi() {
		return openApiConfig.englishHubOpenAPI(SERVER_URL, SERVER_DESCRIPTION);
	}

	@Test
	void exposesASpecWithTheBearerJwtScheme() {
		var openApi = buildOpenApi();

		assertThat(openApi.getInfo().getTitle()).isEqualTo("EnglishHub API");
		SecurityScheme scheme = openApi.getComponents().getSecuritySchemes().get("bearerAuth");
		assertThat(scheme).isNotNull();
		assertThat(scheme.getType()).isEqualTo(SecurityScheme.Type.HTTP);
		assertThat(scheme.getScheme()).isEqualTo("bearer");
		assertThat(scheme.getBearerFormat()).isEqualTo("JWT");
	}

	@Test
	void requiresBearerAuthGloballyByDefault() {
		var openApi = buildOpenApi();

		assertThat(openApi.getSecurity()).hasSize(1);
		SecurityRequirement requirement = openApi.getSecurity().get(0);
		assertThat(requirement.get("bearerAuth")).isEmpty();
	}

	@Test
	void advertisesTheConfiguredServerFirstAndLocalSecond() {
		var openApi = buildOpenApi();

		assertThat(openApi.getServers()).hasSize(2);
		assertThat(openApi.getServers().get(0).getUrl()).isEqualTo(SERVER_URL);
		assertThat(openApi.getServers().get(0).getDescription()).isEqualTo(SERVER_DESCRIPTION);
		assertThat(openApi.getServers().get(1).getUrl()).isEqualTo("http://localhost:8080");
		assertThat(openApi.getServers().get(1).getDescription()).isEqualTo("Local");
	}
}