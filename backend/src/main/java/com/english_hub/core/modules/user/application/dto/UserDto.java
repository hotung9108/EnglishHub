package com.english_hub.core.modules.user.application.dto;

import com.english_hub.core.common.application.BaseDto;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import java.time.LocalDate;
import lombok.Getter;
import lombok.Setter;

/** Application DTO used by the generic User CRUD service. */
@Getter
@Setter
public class UserDto extends BaseDto<Long> {

	private String fullName;
	private String email;
	private String phone;
	private String avatarUrl;
	private String password;
	private String passwordHash;
	private UserRole role;
	private UserStatus status;
	private boolean deleted;
	private String specialization;
	private String studentCode;
	private LocalDate dateOfBirth;
	private String parentPhone;
}
