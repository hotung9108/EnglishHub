package com.english_hub.backend.features.user.application.mapper;

import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import com.english_hub.backend.common.mapper.IMapper;
import com.english_hub.backend.features.user.application.dto.UserDto;
import com.english_hub.backend.features.user.domain.model.User;
import org.springframework.stereotype.Component;

/** Maps the User aggregate to the generic application DTO. */
@Component
public class UserMapper implements IMapper<User, UserDto> {

	@Override
	public UserDto toDto(User source) {
		UserDto dto = new UserDto();
		dto.setId(source.id());
		dto.setFullName(source.fullName());
		dto.setEmail(source.email());
		dto.setPhone(source.phone());
		dto.setAvatarUrl(source.avatarUrl());
		dto.setRole(source.role());
		dto.setStatus(source.status());
		dto.setDeleted(source.deleted());
		dto.setSpecialization(source.specialization());
		dto.setStudentCode(source.studentCode());
		dto.setDateOfBirth(source.dateOfBirth());
		dto.setParentPhone(source.parentPhone());
		// Password material is never copied to an outward-facing DTO.
		return dto;
	}

	@Override
	public User toEntity(UserDto dto) {
		UserRole role = dto.getRole() == null ? UserRole.STUDENT : dto.getRole();
		UserStatus status = dto.getStatus() == null ? UserStatus.ACTIVE : dto.getStatus();
		String passwordHash = dto.getPasswordHash() != null ? dto.getPasswordHash() : dto.getPassword();
		return new User(
				dto.getId(),
				dto.getFullName(),
				dto.getEmail(),
				dto.getPhone(),
				dto.getAvatarUrl(),
				passwordHash,
				role,
				status,
				dto.isDeleted(),
				dto.getSpecialization(),
				dto.getStudentCode(),
				dto.getDateOfBirth(),
				dto.getParentPhone());
	}
}
