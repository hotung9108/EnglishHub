package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.features.user.infrastructure.persistence.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
}
