package com.english_hub.core.infrastructure.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpMethod;
import org.springframework.util.AntPathMatcher;

import java.util.List;

public final class ApiRoutePolicy {

	private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

	private static final List<RouteRule> ROUTES = List.of(
			// Auth: public
			new RouteRule(HttpMethod.POST, "/api/v1/auth/login", List.of()),
			new RouteRule(HttpMethod.POST, "/api/v1/auth/refresh", List.of()),
			new RouteRule(HttpMethod.POST, "/api/v1/auth/logout", List.of()),

			// User administration
			new RouteRule(HttpMethod.GET, "/api/v1/admin/users", List.of("ADMIN")),
			new RouteRule(HttpMethod.POST, "/api/v1/admin/users", List.of("ADMIN")),
			new RouteRule(HttpMethod.PUT, "/api/v1/admin/users/{id}", List.of("ADMIN")),
			new RouteRule(HttpMethod.DELETE, "/api/v1/admin/users/{id}", List.of("ADMIN")),
			new RouteRule(HttpMethod.PATCH, "/api/v1/admin/users/{id}/status", List.of("ADMIN")),

			// Own profile
			new RouteRule(HttpMethod.GET, "/api/v1/users/me", List.of("ADMIN", "TEACHER", "STUDENT")),
			new RouteRule(HttpMethod.PUT, "/api/v1/users/me", List.of("ADMIN", "TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.PATCH,
					"/api/v1/users/me/password",
					List.of("ADMIN", "TEACHER", "STUDENT")),

			// Classes
			new RouteRule(HttpMethod.POST, "/api/v1/classes", List.of("ADMIN")),
			new RouteRule(HttpMethod.GET, "/api/v1/classes", List.of("ADMIN", "TEACHER")),
			new RouteRule(HttpMethod.GET, "/api/v1/classes/{id}", List.of("ADMIN", "TEACHER")),
			new RouteRule(HttpMethod.GET, "/api/v1/classes/{id}/members", List.of("ADMIN", "TEACHER")),

			// Assignment
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/classes/{classId}/assignments",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/classes/{classId}/assignments",
					List.of("TEACHER")),
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/assignments/{assignmentId}",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.PUT,
					"/api/v1/assignments/{assignmentId}",
					List.of("TEACHER")),
			new RouteRule(
					HttpMethod.DELETE,
					"/api/v1/assignments/{assignmentId}",
					List.of("TEACHER")),
			new RouteRule(
					HttpMethod.PATCH,
					"/api/v1/assignments/{assignmentId}/status",
					List.of("TEACHER")),

			// Question
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/modules/{moduleId}/questions",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/modules/{moduleId}/questions",
					List.of("TEACHER")),
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/questions/{questionId}",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.PUT,
					"/api/v1/questions/{questionId}",
					List.of("TEACHER")),
			new RouteRule(
					HttpMethod.DELETE,
					"/api/v1/questions/{questionId}",
					List.of("TEACHER")),

			// Module
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/assignments/{assignmentId}/modules",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/assignments/{assignmentId}/modules",
					List.of("TEACHER")),
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/modules/{moduleId}",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(HttpMethod.PUT, "/api/v1/modules/{moduleId}", List.of("TEACHER")),
			new RouteRule(HttpMethod.DELETE, "/api/v1/modules/{moduleId}", List.of("TEACHER")),
			new RouteRule(HttpMethod.POST, "/api/v1/modules/{moduleId}/audio", List.of("TEACHER")),

			// Submission
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/assignments/{assignmentId}/submissions",
					List.of("STUDENT")),
			new RouteRule(HttpMethod.GET, "/api/v1/submissions/{id}", List.of("ADMIN", "TEACHER", "STUDENT")),
			new RouteRule(HttpMethod.GET, "/api/v1/submissions", List.of("ADMIN", "TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/submission-modules/{id}/submit",
					List.of("STUDENT")),
			new RouteRule(HttpMethod.POST, "/api/v1/submissions/{id}/submit", List.of("STUDENT")),
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/submission-modules/{id}",
					List.of("ADMIN", "TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/submission-modules/{id}/audio-upload-url",
					List.of("STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/submission-modules/{id}/document-upload-url",
					List.of("STUDENT")),

			// Grading
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/submission-modules/{id}/grading",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/submission-modules/{id}/grading/ai-analyze",
					List.of("TEACHER")),
			new RouteRule(HttpMethod.PUT, "/api/v1/gradings/{id}", List.of("TEACHER")),
			new RouteRule(HttpMethod.GET, "/api/v1/gradings/{id}", List.of("TEACHER", "STUDENT")),
			new RouteRule(HttpMethod.GET, "/api/v1/gradings", List.of("ADMIN", "TEACHER")),
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/answers/{id}/annotations",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/answers/{id}/annotations",
					List.of("TEACHER")),
			new RouteRule(HttpMethod.PATCH, "/api/v1/annotations/{id}/review", List.of("TEACHER")),
			new RouteRule(HttpMethod.DELETE, "/api/v1/annotations/{id}", List.of("TEACHER")),
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/gradings/{id}/change-logs",
					List.of("ADMIN", "TEACHER")),

			// Student Evaluation
			new RouteRule(
					HttpMethod.GET,
					"/api/v1/students/{id}/evaluations",
					List.of("TEACHER", "STUDENT")),
			new RouteRule(
					HttpMethod.POST,
					"/api/v1/students/{id}/evaluations",
					List.of("TEACHER")),
			new RouteRule(HttpMethod.GET, "/api/v1/evaluations/{id}", List.of("TEACHER", "STUDENT")),
			new RouteRule(HttpMethod.PUT, "/api/v1/evaluations/{id}", List.of("TEACHER")),
			new RouteRule(HttpMethod.DELETE, "/api/v1/evaluations/{id}", List.of("TEACHER")));

	private ApiRoutePolicy() {
	}

	public static List<RouteRule> routes() {
		return ROUTES;
	}

	public static boolean contains(HttpServletRequest request) {
		String path = request.getServletPath();
		if (path == null || path.isEmpty()) {
			String requestUri = request.getRequestURI();
			String contextPath = request.getContextPath();
			path = requestUri.substring(contextPath.length());
		}

		String requestPath = path;
		String requestMethod = request.getMethod();
		return ROUTES.stream().anyMatch(route ->
				route.method().name().equals(requestMethod)
						&& PATH_MATCHER.match(route.pathPattern(), requestPath));
	}

	public record RouteRule(HttpMethod method, String pathPattern, List<String> roles) {
		public RouteRule {
			roles = List.copyOf(roles);
		}
	}
}
