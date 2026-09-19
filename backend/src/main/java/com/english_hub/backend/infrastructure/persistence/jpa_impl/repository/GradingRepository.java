package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.Grading;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingRepository extends JpaRepository<Grading, Long> {
}
