package com.english_hub.backend.user.repository;

import com.english_hub.backend.user.entity.TeacherProfile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {
}
