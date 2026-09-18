package com.english_hub.backend.classes.repository;

import com.english_hub.backend.classes.entity.ClassMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassMemberRepository extends JpaRepository<ClassMember, Long> {
}
