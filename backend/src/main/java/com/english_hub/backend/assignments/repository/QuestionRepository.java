package com.english_hub.backend.assignments.repository;

import com.english_hub.backend.assignments.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {
}
