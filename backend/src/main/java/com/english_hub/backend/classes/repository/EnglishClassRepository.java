package com.english_hub.backend.classes.repository;

import com.english_hub.backend.classes.entity.EnglishClass;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnglishClassRepository extends JpaRepository<EnglishClass, Long> {
}
