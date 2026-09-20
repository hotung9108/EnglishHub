package com.english_hub.core.modules.classroom.infrastructure.adapter;

import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.classroom.infrastructure.mapper.ClassPersistenceMapper;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/** JPA adapter for the ClassRepository domain port. */
@Repository
public class ClassJpaAdapter implements ClassRepository {

	private final ClassJpaRepository jpaRepository;
	private final ClassPersistenceMapper mapper;

	public ClassJpaAdapter(ClassJpaRepository jpaRepository, ClassPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	public Optional<EnglishClass> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public List<EnglishClass> findAll() {
		return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
	}

	@Override
	public boolean existsById(Long id) {
		return jpaRepository.existsById(id);
	}

	@Override
	public long count() {
		return jpaRepository.count();
	}

	@Override
	public EnglishClass save(EnglishClass entity) {
		ClassEntity saved = jpaRepository.save(mapper.toEntity(entity));
		return mapper.toDomain(saved);
	}

	@Override
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}
}