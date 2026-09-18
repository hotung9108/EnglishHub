package com.english_hub.backend.features.user.interfaces.rest.dto;

import com.english_hub.backend.common.application.BaseDto;
import java.util.Objects;
import lombok.EqualsAndHashCode;
import lombok.Getter;

@Getter
@EqualsAndHashCode
public class CreatedUserResponse {

	private final String message;
	private final CreatedUser user;

	public CreatedUserResponse(String message, CreatedUser user) {
		this.message = message;
		this.user = user;
	}

	public String message() {
		return message;
	}

	public CreatedUser user() {
		return user;
	}

	@Getter
	public static class CreatedUser extends BaseDto<Long> {

		private final String email;
		private final String role;

		public CreatedUser(Long id, String email, String role) {
			setId(id);
			this.email = email;
			this.role = role;
		}

		public Long id() {
			return getId();
		}

		public String email() {
			return email;
		}

		public String role() {
			return role;
		}

		@Override
		public boolean equals(Object object) {
			if (this == object) {
				return true;
			}
			if (!(object instanceof CreatedUser other)) {
				return false;
			}
			return Objects.equals(getId(), other.getId())
					&& Objects.equals(email, other.email)
					&& Objects.equals(role, other.role);
		}

		@Override
		public int hashCode() {
			return Objects.hash(getId(), email, role);
		}
	}
}
