package com.english_hub.backend.user.entity;

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
@Table(name = "teacher_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TeacherProfile {

	@Id
	@Column(name = "user_id")
	private Long userId;

	@MapsId
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(length = 150)
	private String specialization;

	public TeacherProfile(User user, String specialization) {
		this.user = user;
		this.specialization = specialization;
	}
}
