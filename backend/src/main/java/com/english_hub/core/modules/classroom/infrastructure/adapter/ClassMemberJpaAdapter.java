package com.english_hub.core.modules.classroom.infrastructure.adapter;

import com.english_hub.core.modules.classroom.domain.model.ClassMember;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.infrastructure.mapper.ClassPersistenceMapper;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

/** JPA adapter for the ClassMemberRepository domain port. */
@Repository
public class ClassMemberJpaAdapter implements ClassMemberRepository {

	private final ClassMemberJpaRepository jpaRepository;
	private final ClassPersistenceMapper mapper;

	public ClassMemberJpaAdapter(ClassMemberJpaRepository jpaRepository, ClassPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.mapper = mapper;
	}

	@Override
	public Optional<ClassMember> findById(Long id) {
		return jpaRepository.findById(id).map(mapper::toDomain);
	}

	@Override
	public List<ClassMember> findAll() {
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
	public ClassMember save(ClassMember entity) {
		ClassMemberEntity saved = jpaRepository.save(mapper.toEntity(entity));
		return mapper.toDomain(saved);
	}

	@Override
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}

	@Override
	public List<ClassMember> findByClassId(Long classId) {
		return jpaRepository.findByClassId(classId).stream().map(mapper::toDomain).toList();
	}

	@Override
	public long countByClassId(Long classId) {
		return jpaRepository.countByClassId(classId);
	}

	@Override
	public boolean existsByClassIdAndStudentId(Long classId, Long studentId) {
		return jpaRepository.existsByClassIdAndStudentId(classId, studentId);
	}

	@Override
	public Optional<ClassMember> findByClassIdAndId(Long classId, Long memberId) {
		return jpaRepository.findByClassIdAndId(classId, memberId).map(mapper::toDomain);
	}
}