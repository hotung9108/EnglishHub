package com.english_hub.core.modules.classroom.infrastructure.adapter;

import com.english_hub.core.common.domain.UserRole;
import com.english_hub.core.modules.classroom.application.page.ClassPageRequest;
import com.english_hub.core.modules.classroom.domain.model.ClassPage;
import com.english_hub.core.modules.classroom.domain.model.ClassStatus;
import com.english_hub.core.modules.classroom.domain.model.EnglishClass;
import com.english_hub.core.modules.classroom.domain.model.TeacherInfo;
import com.english_hub.core.modules.classroom.domain.repository.ClassRepository;
import com.english_hub.core.modules.classroom.infrastructure.mapper.ClassPersistenceMapper;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.entity.ClassMemberEntity;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassJpaRepository;
import com.english_hub.core.modules.classroom.infrastructure.persistence.repository.ClassMemberJpaRepository;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the ClassRepository domain port. */
@Repository
public class ClassJpaAdapter implements ClassRepository {

	private final ClassJpaRepository jpaRepository;
	private final ClassMemberJpaRepository classMemberJpaRepository;
	private final com.english_hub.core.infrastructure.persistence.repository.UserRepository userJpaRepository;
	private final com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository teacherProfileRepository;
	private final com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository assignmentRepository;
	private final com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository studentEvaluationRepository;
	private final ClassPersistenceMapper mapper;

	public ClassJpaAdapter(
			ClassJpaRepository jpaRepository,
			ClassMemberJpaRepository classMemberJpaRepository,
			com.english_hub.core.infrastructure.persistence.repository.UserRepository userJpaRepository,
			com.english_hub.core.infrastructure.persistence.repository.TeacherProfileRepository teacherProfileRepository,
			com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository assignmentRepository,
			com.english_hub.core.infrastructure.persistence.repository.StudentEvaluationRepository studentEvaluationRepository,
			ClassPersistenceMapper mapper) {
		this.jpaRepository = jpaRepository;
		this.classMemberJpaRepository = classMemberJpaRepository;
		this.userJpaRepository = userJpaRepository;
		this.teacherProfileRepository = teacherProfileRepository;
		this.assignmentRepository = assignmentRepository;
		this.studentEvaluationRepository = studentEvaluationRepository;
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

	@Override
	@Transactional(readOnly = true)
	public ClassPage findPage(
			ClassStatus status,
			UserRole callerRole,
			long callerUserId,
			ClassPageRequest pageRequest) {
		Specification<ClassEntity> specification = buildSpecification(status, callerRole, callerUserId);
		Pageable pageable = PageRequest.of(
				pageRequest.page() - 1,
				pageRequest.limit(),
				Sort.by(Sort.Direction.DESC, "id"));
		Page<ClassEntity> page = jpaRepository.findAll(specification, pageable);
		List<EnglishClass> classes = page.getContent().stream().map(mapper::toDomain).toList();
		return new ClassPage(classes, pageRequest.page(), pageRequest.limit(), page.getTotalElements());
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<TeacherInfo> findTeacher(Long teacherId) {
		return userJpaRepository.findById(teacherId)
				.map(user -> new TeacherInfo(user.getId(), user.getFullName()));
	}

	@Override
	public boolean teacherExists(Long teacherId) {
		return teacherProfileRepository.existsById(teacherId);
	}

	@Transactional(readOnly = true)
	@Override
	public boolean hasRelatedData(Long classId) {
		return classMemberJpaRepository.existsByClassId(classId)
				|| assignmentRepository.existsByClassId(classId)
				|| studentEvaluationRepository.existsByClassId(classId);
	}

	private Specification<ClassEntity> buildSpecification(
			ClassStatus status,
			UserRole callerRole,
			long callerUserId) {
		return (root, query, criteriaBuilder) -> {
			List<Predicate> predicates = new ArrayList<>();
			if (status != null) {
				predicates.add(criteriaBuilder.equal(root.get("status"), status));
			}
			if (callerRole == UserRole.TEACHER) {
				predicates.add(criteriaBuilder.equal(root.get("teacherId"), callerUserId));
			} else if (callerRole == UserRole.STUDENT) {
				predicates.add(criteriaBuilder.exists(
						studentMembershipSubquery(root, callerUserId, query, criteriaBuilder)));
			}
			return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
		};
	}

	private Subquery<Long> studentMembershipSubquery(
			Root<ClassEntity> classRoot,
			long studentUserId,
			jakarta.persistence.criteria.CriteriaQuery<?> query,
			jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder) {
		Subquery<Long> subquery = query.subquery(Long.class);
		Root<ClassMemberEntity> memberRoot = subquery.from(ClassMemberEntity.class);
		subquery.select(memberRoot.get("id"));
		subquery.where(
				criteriaBuilder.equal(memberRoot.get("classId"), classRoot.get("id")),
				criteriaBuilder.equal(memberRoot.get("studentId"), studentUserId));
		return subquery;
	}
}