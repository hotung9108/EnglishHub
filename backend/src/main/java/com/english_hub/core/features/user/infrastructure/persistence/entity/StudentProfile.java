package com.english_hub.core.features.user.infrastructure.persistence.entity;

import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "student_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentProfile {

	@Id
	@Column(name = "user_id")
	private Long userId;

	@MapsId
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "student_code", length = 30, unique = true)
	private String studentCode;

	@Column(name = "date_of_birth")
	private LocalDate dateOfBirth;

	@Column(name = "parent_phone", length = 20)
	private String parentPhone;

	public StudentProfile(
			User user,
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		this.user = user;
		this.studentCode = studentCode;
		this.dateOfBirth = dateOfBirth;
		this.parentPhone = parentPhone;
	}

	public void update(
			String studentCode,
			LocalDate dateOfBirth,
			String parentPhone) {
		this.studentCode = studentCode;
		this.dateOfBirth = dateOfBirth;
		this.parentPhone = parentPhone;
	}
}
