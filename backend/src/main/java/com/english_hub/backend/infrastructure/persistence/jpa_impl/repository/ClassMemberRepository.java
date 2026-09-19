package com.english_hub.backend.infrastructure.persistence.jpa_impl.repository;

import com.english_hub.backend.infrastructure.persistence.jpa_impl.entity.ClassMember;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassMemberRepository extends JpaRepository<ClassMember, Long> {
}
