package com.english_hub.core.modules.user.presentation.rest.dto;

import com.english_hub.core.common.application.BaseDto;
import com.english_hub.core.modules.user.domain.model.User;

import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode(callSuper = true)
public class AdminUserSummary extends BaseDto<Long> {

	private final String fullName;
	private final String email;
	private final String role;
	private final String status;

	public AdminUserSummary(Long id, String fullName, String email, String role, String status) {
		setId(id);
		this.fullName = fullName;
		this.email = email;
		this.role = role;
		this.status = status;
	}

	public static AdminUserSummary from(User user) {
		return new AdminUserSummary(
				user.id(),
				user.fullName(),
				user.email(),
				user.role().name(),
				user.status().name());
	}

	public Long id() {
		return getId();
	}

	public String fullName() {
		return fullName;
	}

	public String email() {
		return email;
	}

	public String role() {
		return role;
	}

	public String status() {
		return status;
	}
}
