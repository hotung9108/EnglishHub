package com.english_hub.core.infrastructure.persistence.repository;

import com.english_hub.core.infrastructure.persistence.entity.Question;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {

	List<Question> findByModuleIdOrderByOrderIndexAsc(Long moduleId);

	boolean existsByModuleIdAndOrderIndex(Long moduleId, int orderIndex);

	boolean existsByModuleIdAndOrderIndexAndIdNot(Long moduleId, int orderIndex, Long id);
}
