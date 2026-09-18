package com.english_hub.backend.features.user.interfaces.rest.dto;

import com.english_hub.backend.common.application.BaseDto;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.features.user.domain.model.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;
import lombok.Getter;

@Getter
public class UserResponse extends BaseDto<Long> {

	private final String fullName;
	private final String email;
	private final String role;
	private final String status;
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String phone;
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String avatarUrl;
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String specialization;
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String studentCode;
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final LocalDate dateOfBirth;
	@JsonInclude(JsonInclude.Include.NON_NULL)
	private final String parentPhone;

	private UserResponse(User user) {
		setId(user.id());
		fullName = user.fullName();
		email = user.email();
		role = user.role().name();
		status = user.status().name();
		phone = user.phone();
		avatarUrl = user.avatarUrl();
		specialization = user.role() == UserRole.TEACHER ? user.specialization() : null;
		studentCode = user.role() == UserRole.STUDENT ? user.studentCode() : null;
		dateOfBirth = user.role() == UserRole.STUDENT ? user.dateOfBirth() : null;
		parentPhone = user.role() == UserRole.STUDENT ? user.parentPhone() : null;
	}

	public static UserResponse from(User user) {
		return new UserResponse(user);
	}
}
