package com.english_hub.backend.features.auth.domain.model;

import com.english_hub.backend.common.domain.BaseEntity;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.common.domain.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Account data required by the authentication flows.
 *
 * <p>Bound to the auth context only; the shared role/status enums come from
 * {@code common}, not from the user feature.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser extends BaseEntity<Long> {

	private String fullName;

	private String email;

	private String passwordHash;

	private UserRole role;

	private UserStatus status;
}