package com.english_hub.backend.classes.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "class_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ClassMember {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "class_id", nullable = false)
	private Long classId;

	@Column(name = "student_id", nullable = false)
	private Long studentId;

	public ClassMember(Long classId, Long studentId) {
		this.classId = classId;
		this.studentId = studentId;
	}
}
