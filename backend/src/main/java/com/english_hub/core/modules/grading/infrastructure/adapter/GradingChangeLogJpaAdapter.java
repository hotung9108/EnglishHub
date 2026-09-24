package com.english_hub.core.modules.grading.infrastructure.adapter;

import com.english_hub.core.infrastructure.persistence.repository.GradingChangeLogRepository;
import com.english_hub.core.modules.grading.domain.model.GradingChangeLog;
import com.english_hub.core.modules.grading.infrastructure.mapper.GradingPersistenceMapper;
import java.util.List;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class GradingChangeLogJpaAdapter
		implements com.english_hub.core.modules.grading.domain.repository.GradingChangeLogRepository {

	private final GradingChangeLogRepository jpaRepository;
	private final GradingPersistenceMapper mapper;

	public GradingChangeLogJpaAdapter(
			GradingChangeLogRepository jpaRepository,
			GradingPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional
	public GradingChangeLog save(GradingChangeLog changeLog) {
		return mapper.toDomain(jpaRepository.save(mapper.toNewEntity(changeLog)));
	}

	@Override
	@Transactional(readOnly = true)
	public List<GradingChangeLog> findByGradingIdNewestFirst(Long gradingId) {
		return jpaRepository.findByGradingIdOrderByChangedAtDescIdDesc(gradingId).stream()
				.map(mapper::toDomain)
				.toList();
	}
}
