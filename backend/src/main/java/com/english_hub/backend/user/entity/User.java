package com.english_hub.backend.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "full_name", nullable = false, length = 150)
	private String fullName;

	@Column(nullable = false, length = 150, unique = true)
	private String email;

	@Column(length = 20)
	private String phone;

	@Column(name = "avatar_url", length = 255)
	private String avatarUrl;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "user_role")
	private UserRole role;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(nullable = false, columnDefinition = "user_status")
	private UserStatus status;

	@Column(name = "is_deleted", nullable = false)
	private boolean deleted;

	public User(
			String fullName,
			String email,
			String phone,
			String passwordHash,
			UserRole role,
			UserStatus status,
			boolean deleted) {
		this.fullName = fullName;
		this.email = email;
		this.phone = phone;
		this.passwordHash = passwordHash;
		this.role = role;
		this.status = status;
		this.deleted = deleted;
	}
}
