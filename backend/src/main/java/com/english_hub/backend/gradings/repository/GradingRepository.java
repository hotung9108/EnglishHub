package com.english_hub.backend.gradings.repository;

import com.english_hub.backend.gradings.entity.Grading;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingRepository extends JpaRepository<Grading, Long> {
}
