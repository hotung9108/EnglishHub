package com.english_hub.core.features.user.interfaces.rest;

import com.english_hub.core.common.domain.UserStatus;
import com.english_hub.core.features.user.application.command.CreateUserCommand;
import com.english_hub.core.features.user.application.command.UpdateUserCommand;
import com.english_hub.core.features.user.application.command.UpdateUserStatusCommand;
import com.english_hub.core.features.user.application.service.AdminUserService;
import com.english_hub.core.features.user.domain.model.UserPage;
import com.english_hub.core.features.user.interfaces.rest.dto.AdminUserListResponse;
import com.english_hub.core.features.user.interfaces.rest.dto.AdminUserSummary;
import com.english_hub.core.features.user.interfaces.rest.dto.CreateUserRequest;
import com.english_hub.core.features.user.interfaces.rest.dto.CreatedUserResponse;
import com.english_hub.core.features.user.interfaces.rest.dto.MessageResponse;
import com.english_hub.core.features.user.interfaces.rest.dto.PaginationResponse;
import com.english_hub.core.features.user.interfaces.rest.dto.UpdateUserRequest;
import com.english_hub.core.features.user.interfaces.rest.dto.UpdateUserStatusRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

	private final AdminUserService adminUserService;

	public AdminUserController(AdminUserService adminUserService) {
		this.adminUserService = adminUserService;
	}

	@GetMapping
	public ResponseEntity<AdminUserListResponse> listUsers(
			@RequestParam(required = false, defaultValue = "") String q,
			@RequestParam(required = false, defaultValue = "") String role,
			@RequestParam(defaultValue = "1") int page,
			@RequestParam(defaultValue = "20") int limit) {
		UserPage result = adminUserService.listUsers(q, role, page, limit);
		AdminUserListResponse response = new AdminUserListResponse(
				result.users().stream().map(AdminUserSummary::from).toList(),
				new PaginationResponse(result.page(), result.limit(), result.total()));
		return ResponseEntity.ok(response);
	}

	@PostMapping
	public ResponseEntity<CreatedUserResponse> createUser(@RequestBody CreateUserRequest request) {
		AdminUserService.CreatedUserData created = adminUserService.createUser(new CreateUserCommand(
				request == null ? null : request.fullName(),
				request == null ? null : request.email(),
				request == null ? null : request.password(),
				request == null ? null : request.role(),
				request == null ? null : request.specialization(),
				request == null ? null : request.studentCode(),
				request == null ? null : request.dateOfBirth(),
				request == null ? null : request.parentPhone()));
		return ResponseEntity.status(HttpStatus.CREATED).body(new CreatedUserResponse(
				"Tạo tài khoản thành công.",
				new CreatedUserResponse.CreatedUser(created.id(), created.email(), created.role())));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> updateUser(
			@PathVariable long id,
			@RequestBody UpdateUserRequest request) {
		adminUserService.updateUser(id, new UpdateUserCommand(
				request == null ? null : request.fullName(),
				request == null ? null : request.phone(),
				request == null ? null : request.specialization(),
				request == null ? null : request.studentCode(),
				request == null ? null : request.dateOfBirth(),
				request == null ? null : request.parentPhone()));
		return ResponseEntity.ok(new MessageResponse("Cập nhật người dùng thành công."));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> deleteUser(@PathVariable long id) {
		adminUserService.deleteUser(id);
		return ResponseEntity.ok(new MessageResponse("Đã xoá người dùng."));
	}

	@PatchMapping("/{id}/status")
	public ResponseEntity<MessageResponse> updateStatus(
			@PathVariable long id,
			@RequestBody UpdateUserStatusRequest request) {
		UserStatus status = adminUserService.updateStatus(id,
				new UpdateUserStatusCommand(request == null ? null : request.status()));
		String message = status == UserStatus.LOCKED ? "Đã khoá tài khoản." : "Đã mở khoá tài khoản.";
		return ResponseEntity.ok(new MessageResponse(message));
	}
}
