package com.english_hub.core.features.user.interfaces.rest;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.modules.user.application.command.ChangePasswordCommand;
import com.english_hub.core.modules.user.application.command.UpdateOwnProfileCommand;
import com.english_hub.core.modules.user.application.service.UserProfileService;
import com.english_hub.core.modules.user.domain.model.User;
import com.english_hub.core.modules.user.presentation.rest.UserController;
import com.english_hub.core.modules.user.presentation.rest.dto.ChangePasswordRequest;
import com.english_hub.core.modules.user.presentation.rest.dto.MessageResponse;
import com.english_hub.core.modules.user.presentation.rest.dto.UpdateOwnProfileRequest;
import com.english_hub.core.modules.user.presentation.rest.dto.UserResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

	@Mock
	private UserProfileService userProfileService;

	private UserController userController;

	@BeforeEach
	void setUp() {
		userController = new UserController(userProfileService);
	}

	@Test
	void returnsTheAuthenticatedProfileWithoutThePasswordHash() {
		when(userProfileService.getMyProfile()).thenReturn(user(12L));

		ResponseEntity<UserResponse> response = userController.getMyProfile();

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody().getId()).isEqualTo(12L);
		assertThat(response.getBody().getFullName()).isEqualTo("Teacher");
		assertThat(response.getBody().getRole()).isEqualTo("TEACHER");
		assertThat(response.getBody().getSpecialization()).isEqualTo("IELTS Writing");
	}

	@Test
	void mapsTheOwnProfileUpdateAndReturnsTheContractMessage() {
		ResponseEntity<MessageResponse> response = userController.updateMyProfile(
				new UpdateOwnProfileRequest("Updated", "0900000000", "https://example.com/avatar.png"));

		verify(userProfileService).updateMyProfile(new UpdateOwnProfileCommand(
				"Updated", "0900000000", "https://example.com/avatar.png"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Cập nhật thông tin thành công."));
	}

	@Test
	void mapsThePasswordChangeAndReturnsTheContractMessage() {
		ResponseEntity<MessageResponse> response = userController.changePassword(
				new ChangePasswordRequest("Current05Password", "Newpass05"));

		verify(userProfileService).changePassword(new ChangePasswordCommand("Current05Password", "Newpass05"));
		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
		assertThat(response.getBody()).isEqualTo(new MessageResponse("Đổi mật khẩu thành công."));
	}

	private User user(long id) {
		return new User(id, "Teacher", "teacher@example.com", "0900000000", "https://example.com/avatar.png",
				"should-not-be-exposed", UserRole.TEACHER, UserStatus.ACTIVE, false, "IELTS Writing", null, null, null);
	}
}
