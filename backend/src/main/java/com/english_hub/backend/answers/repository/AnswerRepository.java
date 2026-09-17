package com.english_hub.backend.answers.repository;

import com.english_hub.backend.answers.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
}
