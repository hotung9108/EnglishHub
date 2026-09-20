package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.features.user.infrastructure.persistence.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
}
