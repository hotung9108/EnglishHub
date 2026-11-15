package com.english_hub.core.features.user.interfaces.rest;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.common.ApiException;
import com.english_hub.core.modules.user.application.command.CreateUserCommand;
import com.english_hub.core.modules.user.application.command.UpdateUserCommand;
import com.english_hub.core.modules.user.application.command.UpdateUserStatusCommand;
import com.english_hub.core.modules.user.application.service.AdminUserService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.domain.model.UserPage;
import com.english_hub.core.modules.user.presentation.rest.AdminUserController;
import com.english_hub.core.modules.user.presentation.rest.dto.AdminUserListResponse;
import com.english_hub.core.modules.user.presentation.rest.dto.AdminResetPasswordResponse;
import com.english_hub.core.modules.user.infrastructure.security.SecureRandomPasswordGenerator;
import com.english_hub.core.modules.user.presentation.rest.dto.CreateUserRequest;
import com.english_hub.core.modules.user.presentation.rest.dto.CreatedUserResponse;
import com.english_hub.core.modules.user.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.user.presentation.rest.dto.UpdateUserRequest;
import com.english_hub.core.modules.user.presentation.rest.dto.UpdateUserStatusRequest;
import com.english_hub.core.modules.user.presentation.rest.dto.UserResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserControllerTest {

	@Mock
	private AdminUserService adminUserService;

	private AdminUserController adminUserController;

	@BeforeEach
	void setUp() {
		adminUserController = new AdminUserController(adminUserService);
	}

	@Test
	void mapsTheAdminUserListAndPagination() {
		when(adminUserService.listUsers("alice", "TEACHER", 2, 10))
				.thenReturn(new UserPage(List.of(user(41L)), 2, 10, 11));

		ResponseEntity<AdminUserListResponse> response = adminUserController.listUsers("alice", "TEACHER", 2, 10);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().data()).hasSize(1);
		assertThat(response.getBody().data().getFirst().email()).isEqualTo("teacher@example.com");
		assertThat(response.getBody().pagination().total()).isEqualTo(11);
	}

	@Test
	void mapsTheCreateUserRequestAndReturnsCreated() {
		when(adminUserService.createUser(new CreateUserCommand(
				"Student", "student@example.com", "Student05", "STUDENT", null,
				"HV0041", LocalDate.of(2004, 4, 1), "0912345678")))
				.thenReturn(new AdminUserService.CreatedUserData(41L, "student@example.com", "STUDENT"));

		ResponseEntity<CreatedUserResponse> response = adminUserController.createUser(new CreateUserRequest(
				"Student", "student@example.com", "Student05", "STUDENT", null,
				"HV0041", LocalDate.of(2004, 4, 1), "0912345678"));

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
		assertThat(response.getBody()).isEqualTo(new CreatedUserResponse(
				"Tạo tài khoản thành công.",
				new CreatedUserResponse.CreatedUser(41L, "student@example.com", "STUDENT")));
	}

	@Test
	void mapsTheAdminUpdateRequest() {
		ResponseEntity<MessageResponse> response = adminUserController.updateUser(41L,
				new UpdateUserRequest("Updated", "0900000000", "IELTS", null, null, null));

		verify(adminUserService).updateUser(41L,
				new UpdateUserCommand("Updated", "0900000000", "IELTS", null, null, null));
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Cập nhật người dùng thành công."));
	}

	@Test
	void mapsSoftDeleteToTheContractMessage() {
		ResponseEntity<MessageResponse> response = adminUserController.deleteUser(41L);

		verify(adminUserService).deleteUser(41L);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đã xoá người dùng."));
	}

	@Test
	void mapsLockStatusToTheLockMessage() {
		when(adminUserService.updateStatus(41L, new UpdateUserStatusCommand("LOCKED")))
				.thenReturn(UserStatus.LOCKED);

		ResponseEntity<MessageResponse> response = adminUserController.updateStatus(
				41L, new UpdateUserStatusRequest("LOCKED"));

		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đã khoá tài khoản."));
	}

	@Test
	void mapsActiveStatusToTheUnlockMessage() {
		when(adminUserService.updateStatus(41L, new UpdateUserStatusCommand("ACTIVE")))
				.thenReturn(UserStatus.ACTIVE);

		ResponseEntity<MessageResponse> response = adminUserController.updateStatus(
				41L, new UpdateUserStatusRequest("ACTIVE"));

		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đã mở khoá tài khoản."));
	}

	@Test
	void getUser_whenStudentExists_returnsTheRequestedUserResponse() {
		User target = new User(12L, "Ngô Thị Phương", "ngo.thi.phuong@gmail.com", null, null,
				"test-password-hash", UserRole.STUDENT, UserStatus.ACTIVE, false,
				null, "mock-repository-student-code", null, null);
		when(adminUserService.getUser(12L)).thenReturn(target);

		ResponseEntity<UserResponse> response = adminUserController.getUser(12L);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().getId()).isEqualTo(12L);
		assertThat(response.getBody().getFullName()).isEqualTo("Ngô Thị Phương");
		assertThat(response.getBody().getEmail()).isEqualTo("ngo.thi.phuong@gmail.com");
		assertThat(response.getBody().getRole()).isEqualTo("STUDENT");
		assertThat(response.getBody().getStatus()).isEqualTo("ACTIVE");
		assertThat(response.getBody().getStudentCode()).isNotBlank();
		verify(adminUserService).getUser(12L);
	}

	@Test
	void resetPasswordMapsTheServiceResultAndSetsAllThreeCacheHeaders() {
		String generated = new SecureRandomPasswordGenerator().generate();
		AdminUserService.ResetPasswordData result = mock(AdminUserService.ResetPasswordData.class);
		when(result.newPassword()).thenReturn(generated);
		when(adminUserService.resetPassword(12L)).thenReturn(result);

		ResponseEntity<AdminResetPasswordResponse> response = adminUserController.resetPassword(12L);

		verify(adminUserService).resetPassword(12L);
		verifyNoMoreInteractions(adminUserService);
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().getMessage().equals("Đặt lại mật khẩu thành công.")).isTrue();
		assertThat(response.getBody().getNewPassword().equals(generated)).isTrue();
		assertThat(response.getHeaders().getFirst(HttpHeaders.CACHE_CONTROL)).isEqualTo("no-store");
		assertThat(response.getHeaders().getFirst(HttpHeaders.PRAGMA)).isEqualTo("no-cache");
		assertThat(response.getHeaders().getFirst(HttpHeaders.EXPIRES)).isEqualTo("0");
	}

	@ParameterizedTest
	@EnumSource(value = HttpStatus.class, names = {"NOT_FOUND", "BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN"})
	void resetPasswordPropagatesTheServiceApiException(HttpStatus status) {
		ApiException failure = new ApiException(status, "Reset request rejected");
		when(adminUserService.resetPassword(12L)).thenThrow(failure);

		Throwable actual = catchThrowable(() -> adminUserController.resetPassword(12L));

		assertThat(actual == failure).isTrue();
		assertThat(((ApiException) actual).getStatus()).isEqualTo(status);
		verify(adminUserService).resetPassword(12L);
		verifyNoMoreInteractions(adminUserService);
	}

	@Test
	void resetPasswordResponseSerializesExactlyTwoPropertiesAndRedactsItsStringRepresentation() throws Exception {
		String generated = new SecureRandomPasswordGenerator().generate();
		AdminResetPasswordResponse response = new AdminResetPasswordResponse("Đặt lại mật khẩu thành công.", generated);
		JsonMapper mapper = JsonMapper.builder().build();

		String serialized = mapper.writeValueAsString(response);
		JsonNode body = mapper.readTree(serialized);

		Set<String> fields = body.properties().stream().map(field -> field.getKey())
				.collect(java.util.stream.Collectors.toSet());
		assertThat(fields.equals(Set.of("message", "newPassword"))).isTrue();
		assertThat(body.size()).isEqualTo(2);
		assertThat(body.path("message").asString().equals("Đặt lại mật khẩu thành công.")).isTrue();
		assertThat(body.path("newPassword").asString().equals(generated)).isTrue();
		assertThat(serialized.split("\"newPassword\"\\s*:", -1).length - 1).isEqualTo(1);
		assertThat(response.toString().contains(generated)).isFalse();
		assertThat(response.toString().equals("AdminResetPasswordResponse[newPassword=<redacted>]")).isTrue();
	}

	private User user(long id) {
		return new User(id, "Teacher", "teacher@example.com", null, null, "hash", UserRole.TEACHER,
				UserStatus.ACTIVE, false, "IELTS Writing", null, null, null);
	}
}
