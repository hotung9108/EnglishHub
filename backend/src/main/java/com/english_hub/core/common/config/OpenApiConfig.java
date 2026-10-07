package com.english_hub.core.common.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI englishHubOpenAPI(
			@Value("${app.openapi.server-url:https://api-staging.hotung9108.me}") String serverUrl,
			@Value("${app.openapi.server-description:Staging (Cloudflare Tunnel)}") String serverDescription) {
		return new OpenAPI()
				.info(new Info()
						.title("EnglishHub API")
						.description("REST API cho nền tảng quản lý bài tập & chấm chữa bài tiếng Anh.")
						.version("v1"))
				.servers(List.of(
						new Server().url(serverUrl).description(serverDescription),
						new Server().url("http://localhost:8080").description("Local")))
				.addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
				.components(new Components().addSecuritySchemes("bearerAuth",
						new SecurityScheme()
								.name("bearerAuth")
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT")));
	}
}