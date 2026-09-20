package com.english_hub.core.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import com.english_hub.core.modules.user.infrastructure.persistence.entity.User;

import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

	Optional<User> findByIdAndDeletedFalse(Long id);

	List<User> findByDeletedFalse(Sort sort);

	long countByDeletedFalse();

	boolean existsByEmailIgnoreCase(String email);
}
