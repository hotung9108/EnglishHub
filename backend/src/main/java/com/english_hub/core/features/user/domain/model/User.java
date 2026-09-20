package com.english_hub.core.features.user.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.common.domain.UserStatus;
import java.time.Instant;
import java.time.LocalDate;

/**
 * User aggregate root owned by the User bounded context.
 *
 * <p>It deliberately contains no persistence annotations. JPA concerns live
 * in {@code infrastructure.persistence.entity.User}; this model only keeps
 * User business state and mutation rules.</p>
 */
public class User extends BaseEntity<Long> {

	private String fullName;
	private String email;
	private String phone;
	private String avatarUrl;
	private String passwordHash;
	private UserRole role;
	private UserStatus status;
	private boolean deleted;
	private String specialization;
	private String studentCode;
	private LocalDate dateOfBirth;
	private String parentPhone;

	public User(
			Long id,
			String fullName,
			String email,
			String phone,
			String avatarUrl,
			String passwordHash,
			UserRole role,
			UserStatus status,
			boolean deleted,
			String specialization,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		this(id, fullName, email, phone, avatarUrl, passwordHash, role, status, deleted,
				specialization, studentCode, dateOfBirth, parentPhone, null, null);
	}

	public User(
			Long id,
			String fullName,
			String email,
			String phone,
			String avatarUrl,
			String passwordHash,
			UserRole role,
			UserStatus status,
			boolean deleted,
			String specialization,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone,
			Instant createdAt,
			Instant updatedAt) {
		setId(id);
		setCreatedAt(createdAt);
		setUpdatedAt(updatedAt);
		this.fullName = fullName;
		this.email = email;
		this.phone = phone;
		this.avatarUrl = avatarUrl;
		this.passwordHash = passwordHash;
		this.role = role;
		this.status = status;
		this.deleted = deleted;
		this.specialization = specialization;
		this.studentCode = studentCode;
		this.dateOfBirth = dateOfBirth;
		this.parentPhone = parentPhone;
	}

	public static User create(
			String fullName,
			String email,
			String phone,
			String avatarUrl,
			String passwordHash,
			UserRole role,
			UserStatus status,
			String specialization,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		return new User(null, fullName, email, phone, avatarUrl, passwordHash, role, status, false,
				specialization, studentCode, dateOfBirth, parentPhone);
	}

	public boolean isActive() {
		return !deleted && status == UserStatus.ACTIVE;
	}

	public boolean isAdmin() {
		return role == UserRole.ADMIN;
	}

	public void updateFullName(String fullName) {
		this.fullName = fullName;
	}

	public void updatePhone(String phone) {
		this.phone = phone;
	}

	public void updateAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}

	public void updateTeacherProfile(String specialization) {
		this.specialization = specialization;
	}

	public void updateStudentProfile(
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		this.studentCode = studentCode;
		this.dateOfBirth = dateOfBirth;
		this.parentPhone = parentPhone;
	}

	public void changePassword(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void changeStatus(UserStatus status) {
		this.status = status;
	}

	public void softDelete() {
		this.deleted = true;
	}

	// Record-style accessors keep the existing application boundary readable.
	public Long id() {
		return getId();
	}

	public String fullName() {
		return fullName;
	}

	public String email() {
		return email;
	}

	public String phone() {
		return phone;
	}

	public String avatarUrl() {
		return avatarUrl;
	}

	public String passwordHash() {
		return passwordHash;
	}

	public UserRole role() {
		return role;
	}

	public UserStatus status() {
		return status;
	}

	public boolean deleted() {
		return deleted;
	}

	public String specialization() {
		return specialization;
	}

	public String studentCode() {
		return studentCode;
	}

	public LocalDate dateOfBirth() {
		return dateOfBirth;
	}

	public String parentPhone() {
		return parentPhone;
	}
}
