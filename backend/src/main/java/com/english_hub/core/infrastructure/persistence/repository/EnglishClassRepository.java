package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.EnglishClass;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnglishClassRepository extends JpaRepository<EnglishClass, Long> {
}
