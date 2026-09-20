package com.english_hub.core.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;

import java.util.Collection;
import java.util.List;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

	@Query("select sp from StudentProfile sp join fetch sp.user u where sp.userId in :ids and u.deleted = false")
	List<StudentProfile> findAllActiveWithUserByIds(Collection<Long> ids);
}
