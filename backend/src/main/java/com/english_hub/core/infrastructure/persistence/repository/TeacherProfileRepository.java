package com.english_hub.core.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.english_hub.core.modules.user.infrastructure.persistence.entity.TeacherProfile;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {
}
