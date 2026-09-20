package com.english_hub.core.features.user.interfaces.rest;

import com.english_hub.core.features.user.application.command.ChangePasswordCommand;
import com.english_hub.core.features.user.application.command.UpdateOwnProfileCommand;
import com.english_hub.core.features.user.application.service.UserProfileService;
import com.english_hub.core.features.user.domain.model.User;
import com.english_hub.core.features.user.interfaces.rest.dto.MessageResponse;
import com.english_hub.core.features.user.interfaces.rest.dto.UpdateOwnProfileRequest;
import com.english_hub.core.features.user.interfaces.rest.dto.ChangePasswordRequest;
import com.english_hub.core.features.user.interfaces.rest.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

	private final UserProfileService userProfileService;

	public UserController(UserProfileService userProfileService) {
		this.userProfileService = userProfileService;
	}

	@GetMapping("/me")
	public ResponseEntity<UserResponse> getMyProfile() {
		User user = userProfileService.getMyProfile();
		return ResponseEntity.ok(UserResponse.from(user));
	}

	@PutMapping("/me")
	public ResponseEntity<MessageResponse> updateMyProfile(@RequestBody UpdateOwnProfileRequest request) {
		userProfileService.updateMyProfile(new UpdateOwnProfileCommand(
				request == null ? null : request.fullName(),
				request == null ? null : request.phone(),
				request == null ? null : request.avatarUrl()));
		return ResponseEntity.ok(new MessageResponse("Cập nhật thông tin thành công."));
	}

	@PatchMapping("/me/password")
	public ResponseEntity<MessageResponse> changePassword(@RequestBody ChangePasswordRequest request) {
		userProfileService.changePassword(new ChangePasswordCommand(
				request == null ? null : request.currentPassword(),
				request == null ? null : request.newPassword()));
		return ResponseEntity.ok(new MessageResponse("Đổi mật khẩu thành công."));
	}
}
