package com.english_hub.backend.features.user.interfaces.rest;

import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.features.user.application.command.CreateUserCommand;
import com.english_hub.backend.features.user.application.command.UpdateUserCommand;
import com.english_hub.backend.features.user.application.command.UpdateUserStatusCommand;
import com.english_hub.backend.features.user.application.service.AdminUserService;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.features.user.interfaces.rest.dto.AdminUserListResponse;
import com.english_hub.backend.features.user.interfaces.rest.dto.CreateUserRequest;
import com.english_hub.backend.features.user.interfaces.rest.dto.CreatedUserResponse;
import com.english_hub.backend.features.user.interfaces.rest.dto.MessageResponse;
import com.english_hub.backend.features.user.interfaces.rest.dto.UpdateUserRequest;
import com.english_hub.backend.features.user.interfaces.rest.dto.UpdateUserStatusRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
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

	private User user(long id) {
		return new User(id, "Teacher", "teacher@example.com", null, null, "hash", UserRole.TEACHER,
				UserStatus.ACTIVE, false, "IELTS Writing", null, null, null);
	}
}
