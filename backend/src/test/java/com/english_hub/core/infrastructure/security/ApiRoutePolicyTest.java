package com.english_hub.core.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.util.AntPathMatcher;

class ApiRoutePolicyTest {
	private static final String OVERALL_PATH = "/api/v1/evaluations/students/30/overall";
	private static final String EVALUATION_BY_ID_PATH = "/api/v1/evaluations/45";

	@Test
	void overallRouteAllowsAdminsAndTeachersOnly() {
		ApiRoutePolicy.RouteRule route = route(HttpMethod.GET, "/api/v1/evaluations/students/{id}/overall");

		assertThat(route.roles()).containsExactly("ADMIN", "TEACHER");
		assertThat(route.roles()).doesNotContain("STUDENT");
		assertThat(ApiRoutePolicy.contains(request(HttpMethod.GET, OVERALL_PATH))).isTrue();
	}

	@Test
	void overallRouteDoesNotChangeEvaluationByIdRule() {
		ApiRoutePolicy.RouteRule oldRoute = route(HttpMethod.GET, "/api/v1/evaluations/{id}");
		AntPathMatcher pathMatcher = new AntPathMatcher();

		assertThat(oldRoute.roles()).containsExactly("ADMIN", "TEACHER", "STUDENT");
		assertThat(pathMatcher.match(oldRoute.pathPattern(), OVERALL_PATH)).isFalse();
		assertThat(ApiRoutePolicy.contains(request(HttpMethod.GET, EVALUATION_BY_ID_PATH))).isTrue();
	}

	private ApiRoutePolicy.RouteRule route(HttpMethod method, String pathPattern) {
		return ApiRoutePolicy.routes().stream()
				.filter(route -> route.method() == method && route.pathPattern().equals(pathPattern))
				.findFirst()
				.orElseThrow();
	}

	private HttpServletRequest request(HttpMethod method, String path) {
		MockHttpServletRequest request = new MockHttpServletRequest(method.name(), path);
		request.setServletPath(path);
		return request;
	}
}
