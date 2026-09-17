package com.english_hub.backend.user.repository;

import com.english_hub.backend.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}
