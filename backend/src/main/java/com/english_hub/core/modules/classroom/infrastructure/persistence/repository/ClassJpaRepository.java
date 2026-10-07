package com.english_hub.core.modules.classroom.infrastructure.persistence.repository;

import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ClassJpaRepository
		extends JpaRepository<ClassEntity, Long>, JpaSpecificationExecutor<ClassEntity> {
}