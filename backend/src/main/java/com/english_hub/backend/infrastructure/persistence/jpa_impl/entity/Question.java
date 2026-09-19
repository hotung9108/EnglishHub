package com.english_hub.backend.infrastructure.persistence.jpa_impl.entity;

import java.math.BigDecimal;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

@Entity
@Table(name = "questions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Question {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "module_id", nullable = false)
	private Long moduleId;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.NAMED_ENUM)
	@Column(name = "question_type", nullable = false, columnDefinition = "question_type")
	private QuestionType questionType;

	@Column(name = "correct_answer", nullable = false, columnDefinition = "TEXT")
	private String correctAnswer;

	@Column(nullable = false, precision = 5, scale = 2)
	private BigDecimal score;

	@Column(name = "order_index", nullable = false)
	private int orderIndex;

	public Question(
			Long moduleId,
			String content,
			QuestionType questionType,
			String correctAnswer,
			BigDecimal score,
			int orderIndex) {
		this.moduleId = moduleId;
		this.content = content;
		this.questionType = questionType;
		this.correctAnswer = correctAnswer;
		this.score = score;
		this.orderIndex = orderIndex;
	}
}
