package com.english_hub.core.features.user.infrastructure.persistence;

import com.english_hub.core.features.user.domain.model.User;
import com.english_hub.core.features.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.core.features.user.infrastructure.persistence.entity.TeacherProfile;
import java.time.Instant;
import org.springframework.stereotype.Component;

/** Converts the JPA aggregate pieces to the framework-free User domain model. */
@Component
public class UserPersistenceMapper {

	public User toDomain(
			com.english_hub.core.features.user.infrastructure.persistence.entity.User source,
			TeacherProfile teacherProfile,
			StudentProfile studentProfile) {
		return new User(
				source.getId(),
				source.getFullName(),
				source.getEmail(),
				source.getPhone(),
				source.getAvatarUrl(),
				source.getPasswordHash(),
				source.getRole(),
				source.getStatus(),
				source.isDeleted(),
				teacherProfile == null ? null : teacherProfile.getSpecialization(),
				studentProfile == null ? null : studentProfile.getStudentCode(),
				studentProfile == null ? null : studentProfile.getDateOfBirth(),
				studentProfile == null ? null : studentProfile.getParentPhone(),
				toInstant(source.getCreatedAt()),
				toInstant(source.getUpdatedAt()));
	}

	private Instant toInstant(Instant value) {
		return value;
	}
}
