package com.english_hub.core.infrastructure.persistence.entity;

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
@Table(name = "student_evaluations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StudentEvaluation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "student_id", nullable = false)
	private Long studentId;

	@Column(name = "teacher_id", nullable = false)
	private Long teacherId;

	@Column(name = "class_id", nullable = false)
	private Long classId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	public StudentEvaluation(
			Long studentId,
			Long teacherId,
			Long classId,
			String content) {
		this.studentId = studentId;
		this.teacherId = teacherId;
		this.classId = classId;
		this.content = content;
	}
}
