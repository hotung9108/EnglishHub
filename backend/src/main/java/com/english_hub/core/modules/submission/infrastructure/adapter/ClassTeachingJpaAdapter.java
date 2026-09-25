package com.english_hub.core.modules.submission.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.EnglishClassRepository;
import com.english_hub.core.modules.submission.domain.repository.ClassTeachingRepository;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the {@link ClassTeachingRepository} read port. */
@Repository
public class ClassTeachingJpaAdapter implements ClassTeachingRepository {

	private final EnglishClassRepository englishClassRepository;

	public ClassTeachingJpaAdapter(EnglishClassRepository englishClassRepository) {
		this.englishClassRepository = englishClassRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isTeacherOfClass(Long teacherId, Long classId) {
		return englishClassRepository.existsByIdAndTeacherId(classId, teacherId);
	}
}