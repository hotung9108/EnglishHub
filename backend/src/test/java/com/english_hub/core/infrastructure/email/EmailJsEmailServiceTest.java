package com.english_hub.core.infrastructure.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.anything;

import com.english_hub.core.common.ApiException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.client.MockClientHttpRequest;
import org.springframework.mock.http.client.MockClientHttpResponse;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.ResponseCreator;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class EmailJsEmailServiceTest {

	private static final String TO_EMAIL = "teacher@example.com";
	private static final String OTP = "123456";
	private static final String RESET_URL =
			"http://localhost:5173/reset-password?email=teacher@example.com&token=abc";

	private final JsonMapper jsonMapper = JsonMapper.builder().build();

	private MockRestServiceServer server;
	private EmailJsEmailService emailService;

	@BeforeEach
	void setUp() {
		EmailJsProperties properties = new EmailJsProperties();
		properties.setBaseUrl("https://api.emailjs.com");
		properties.setServiceId("service_test");
		properties.setPasswordResetTemplateId("template_reset");
		properties.setPublicKey("public_key");
		properties.setPrivateKey("private_key");

		RestClient.Builder builder = RestClient.builder().baseUrl(properties.getBaseUrl());
		server = MockRestServiceServer.bindTo(builder).build();
		emailService = new EmailJsEmailService(properties, builder.build());
	}

	@Test
	void postsTheExpectedPayloadToEmailJs() {
		server.expect(once(), anything())
				.andExpect(request -> {
					assertThat(request.getURI().toString())
							.isEqualTo("https://api.emailjs.com/api/v1.0/email/send");
					assertThat(request.getMethod().name()).isEqualTo("POST");
					assertThat(request.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_JSON);
				})
				.andRespond(textResponse(200, "OK"));

		emailService.sendPasswordResetOtp(TO_EMAIL, OTP, RESET_URL, 15);

		server.verify();
	}

	@Test
	void mapsCredentialsAndTemplateParametersIntoTheBody() {
		AtomicReference<String> capturedBody = new AtomicReference<>();
		server.expect(once(), anything()).andRespond(request -> {
			if (request instanceof MockClientHttpRequest mockRequest) {
				capturedBody.set(mockRequest.getBodyAsString());
			}
			return textResponse(200, "OK").createResponse(request);
		});

		emailService.sendPasswordResetOtp(TO_EMAIL, OTP, RESET_URL, 15);

		JsonNode body = jsonMapper.readTree(capturedBody.get());
		assertThat(body.get("service_id").asString()).isEqualTo("service_test");
		assertThat(body.get("template_id").asString()).isEqualTo("template_reset");
		assertThat(body.get("user_id").asString()).isEqualTo("public_key");
		assertThat(body.get("accessToken").asString()).isEqualTo("private_key");

		JsonNode params = body.get("template_params");
		assertThat(params.get("to_email").asString()).isEqualTo(TO_EMAIL);
		assertThat(params.get("otp").asString()).isEqualTo(OTP);
		assertThat(params.get("reset_url").asString()).isEqualTo(RESET_URL);
		assertThat(params.get("ttl_minutes").asInt()).isEqualTo(15);
	}

	@Test
	void surfacesProviderRejectionAsBadGateway() {
		server.expect(once(), anything())
				.andRespond(textResponse(400, "The user_id parameter is required"));

		assertThatThrownBy(() -> emailService.sendPasswordResetOtp(TO_EMAIL, OTP, RESET_URL, 15))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_GATEWAY));
	}

	@Test
	void surfacesUnreachableProviderAsBadGateway() {
		server.expect(once(), anything()).andRespond(request -> {
			throw new IOException("connection refused");
		});

		assertThatThrownBy(() -> emailService.sendPasswordResetOtp(TO_EMAIL, OTP, RESET_URL, 15))
				.isInstanceOf(ApiException.class)
				.satisfies(exception -> assertThat(((ApiException) exception).getStatus())
						.isEqualTo(HttpStatus.BAD_GATEWAY));
	}

	private static ResponseCreator textResponse(int status, String body) {
		return request -> {
			MockClientHttpResponse response =
					new MockClientHttpResponse(body.getBytes(StandardCharsets.UTF_8), HttpStatus.valueOf(status));
			response.getHeaders().setContentType(MediaType.TEXT_PLAIN);
			return response;
		};
	}
}
