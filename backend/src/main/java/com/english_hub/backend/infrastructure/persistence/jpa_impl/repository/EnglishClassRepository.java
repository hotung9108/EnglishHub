package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.EnglishClass;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnglishClassRepository extends JpaRepository<EnglishClass, Long> {
}
