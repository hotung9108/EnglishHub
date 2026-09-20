package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.features.user.infrastructure.persistence.entity.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {
}
