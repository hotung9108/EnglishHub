package com.english_hub.core.modules.classroom.infrastructure.adapter;

import com.english_hub.core.modules.classroom.domain.model.ClassCandidatePage;
import com.english_hub.core.modules.classroom.domain.model.ClassCandidateStudent;
import com.english_hub.core.modules.classroom.domain.model.ClassMember;
import com.english_hub.core.modules.classroom.domain.model.ClassMemberDetail;
import com.english_hub.core.modules.classroom.domain.repository.ClassMemberRepository;
import com.english_hub.core.modules.classroom.infrastructure.mapper.ClassPersistenceMapper;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;
import com.english_hub.core.modules.user.infrastructure.persistence.entity.StudentProfile;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.english_hub.core.common.config.CacheConfig;

/** JPA adapter for the ClassMemberRepository domain port. */
@Repository
public class ClassMemberJpaAdapter implements ClassMemberRepository {

	private final ClassMemberJpaRepository jpaRepository;
	private final com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository studentProfileRepository;
	private final ClassPersistenceMapper mapper;

	public ClassMemberJpaAdapter(
			ClassMemberJpaRepository jpaRepository,
			com.english_hub.core.infrastructure.persistence.repository.StudentProfileRepository studentProfileRepository,
			ClassPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.studentProfileRepository = studentProfileRepository;
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
	@CacheEvict(cacheNames = CacheConfig.CLASS_ACCESS, allEntries = true)
	public ClassMember save(ClassMember entity) {
		ClassMemberEntity saved = jpaRepository.save(mapper.toEntity(entity));
		return mapper.toDomain(saved);
	}

	@Override
	@CacheEvict(cacheNames = CacheConfig.CLASS_ACCESS, allEntries = true)
	public void deleteById(Long id) {
		jpaRepository.deleteById(id);
	}

	@Override
	public List<ClassMember> findByClassId(Long classId) {
		return jpaRepository.findByClassId(classId).stream().map(mapper::toDomain).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<ClassMemberDetail> findMembersWithStudentInfo(Long classId) {
		List<ClassMemberEntity> members = jpaRepository.findByClassId(classId);
		Map<Long, StudentProfile> profilesByUserId = studentProfileRepository
				.findAllActiveWithUserByIds(members.stream().map(ClassMemberEntity::getStudentId).toList())
				.stream()
				.collect(Collectors.toMap(StudentProfile::getUserId, Function.identity()));
		return members.stream()
				.sorted(Comparator.comparing(ClassMemberEntity::getId))
				.map(member -> {
					StudentProfile profile = profilesByUserId.get(member.getStudentId());
					if (profile == null) {
						return null;
					}
					return new ClassMemberDetail(
							member.getId(),
							member.getStudentId(),
							profile.getUser().getFullName(),
							profile.getStudentCode());
				})
				.filter(java.util.Objects::nonNull)
				.toList();
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

	@Override
	@Transactional(readOnly = true)
	public ClassCandidatePage findCandidateStudents(long classId, String query, int page, int limit) {
		int normalizedPage = page <= 0 ? 1 : page;
		int clampedLimit = limit <= 0 ? 100 : Math.min(limit, 100);
		String normalizedQuery = query == null ? "" : query.trim();
		Page<Object[]> paged = jpaRepository.findCandidateStudentsRaw(
				classId,
				normalizedQuery,
				PageRequest.of(normalizedPage - 1, clampedLimit));
		List<ClassCandidateStudent> candidates = paged.getContent().stream().map(row -> new ClassCandidateStudent(
				((Number) row[0]).longValue(),
				(String) row[1],
				(String) row[2],
				(String) row[3],
				(String) row[4])).toList();
		return new ClassCandidatePage(candidates, normalizedPage, clampedLimit, paged.getTotalElements());
	}

	@Override
	@Transactional(readOnly = true)
	public List<ClassCandidateStudent> findCandidateStudents(long classId, String query, int limit) {
		return findCandidateStudents(classId, query, 1, limit).candidates();
	}
}