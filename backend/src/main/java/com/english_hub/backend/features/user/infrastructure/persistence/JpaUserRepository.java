package com.english_hub.backend.features.user.infrastructure.persistence;

import com.english_hub.backend.common.ApiException;
import com.english_hub.backend.common.domain.UserRole;
import com.english_hub.backend.features.user.application.page.UserPageRequest;
import com.english_hub.backend.features.user.domain.model.User;
import com.english_hub.backend.features.user.domain.model.UserPage;
import com.english_hub.backend.features.user.domain.repository.UserRepository;
import com.english_hub.backend.features.user.infrastructure.persistence.entity.StudentProfile;
import com.english_hub.backend.features.user.infrastructure.persistence.entity.TeacherProfile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceException;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** JPA adapter for the User domain repository port. */
@Repository
public class JpaUserRepository implements UserRepository {

	private final com.english_hub.backend.user.repository.UserRepository userJpaRepository;
	private final com.english_hub.backend.user.repository.TeacherProfileRepository teacherProfileJpaRepository;
	private final com.english_hub.backend.user.repository.StudentProfileRepository studentProfileJpaRepository;
	private final UserPersistenceMapper mapper;
	private final EntityManager entityManager;

	public JpaUserRepository(
			com.english_hub.backend.user.repository.UserRepository userJpaRepository,
			com.english_hub.backend.user.repository.TeacherProfileRepository teacherProfileJpaRepository,
			com.english_hub.backend.user.repository.StudentProfileRepository studentProfileJpaRepository,
			UserPersistenceMapper mapper,
			EntityManager entityManager) {
		this.userJpaRepository = userJpaRepository;
		this.teacherProfileJpaRepository = teacherProfileJpaRepository;
		this.studentProfileJpaRepository = studentProfileJpaRepository;
		this.mapper = mapper;
		this.entityManager = entityManager;
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<User> findById(Long id) {
		return userJpaRepository.findByIdAndDeletedFalse(id).map(this::toDomain);
	}

	@Override
	@Transactional(readOnly = true)
	public List<User> findAll() {
		return userJpaRepository.findByDeletedFalse(Sort.by(Sort.Direction.ASC, "id"))
				.stream()
				.map(this::toDomain)
				.toList();
	}

	@Override
	@Transactional(readOnly = true)
	public boolean existsById(Long id) {
		return userJpaRepository.findByIdAndDeletedFalse(id).isPresent();
	}

	@Override
	@Transactional(readOnly = true)
	public long count() {
		return userJpaRepository.countByDeletedFalse();
	}

	@Override
	@Transactional
	public User save(User source) {
		com.english_hub.backend.features.user.infrastructure.persistence.entity.User target = source.id() == null
				? new com.english_hub.backend.features.user.infrastructure.persistence.entity.User(
						source.fullName(),
						source.email(),
						source.phone(),
						source.passwordHash(),
						source.role(),
						source.status(),
						source.deleted())
				: userJpaRepository.findById(source.id())
						.orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng."));

		target.updateFrom(
				source.fullName(),
				source.email(),
				source.phone(),
				source.avatarUrl(),
				source.passwordHash(),
				source.role(),
				source.status(),
				source.deleted());
		com.english_hub.backend.features.user.infrastructure.persistence.entity.User saved =
				userJpaRepository.save(target);
		entityManager.flush();
		saveProfile(source, saved);
		entityManager.flush();
		return toDomain(saved);
	}

	@Override
	@Transactional
	public void deleteById(Long id) {
		userJpaRepository.findByIdAndDeletedFalse(id).ifPresent(entity -> {
			entity.updateFrom(
					entity.getFullName(),
					entity.getEmail(),
					entity.getPhone(),
					entity.getAvatarUrl(),
					entity.getPasswordHash(),
					entity.getRole(),
					entity.getStatus(),
					true);
			userJpaRepository.save(entity);
		});
	}

	@Override
	@Transactional(readOnly = true)
	public boolean existsByEmail(String email) {
		return userJpaRepository.existsByEmailIgnoreCase(email);
	}

	@Override
	@Transactional(readOnly = true)
	public UserPage findPage(String query, UserRole role, UserPageRequest pageRequest) {
		String normalizedQuery = query == null ? "" : query.trim().toLowerCase();
		Specification<com.english_hub.backend.features.user.infrastructure.persistence.entity.User> specification =
				(root, ignoredQuery, criteriaBuilder) -> {
					var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
					predicates.add(criteriaBuilder.isFalse(root.get("deleted")));
					if (!normalizedQuery.isBlank()) {
						String pattern = "%" + normalizedQuery + "%";
						predicates.add(criteriaBuilder.or(
								criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), pattern),
								criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern)));
					}
					if (role != null) {
						predicates.add(criteriaBuilder.equal(root.get("role"), role));
					}
					return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
				};

		Pageable pageable = PageRequest.of(
				pageRequest.page() - 1,
				pageRequest.limit(),
				Sort.by(Sort.Direction.ASC, "id"));
		Page<com.english_hub.backend.features.user.infrastructure.persistence.entity.User> page =
				userJpaRepository.findAll(specification, pageable);
		List<User> users = page.getContent().stream().map(this::toDomain).toList();
		return new UserPage(users, pageRequest.page(), pageRequest.limit(), page.getTotalElements());
	}

	@Override
	@Transactional
	public int revokeActiveRefreshTokens(long userId) {
		return entityManager.createNativeQuery("""
				UPDATE refresh_tokens
				SET revoked_at = CURRENT_TIMESTAMP
				WHERE user_id = :userId AND revoked_at IS NULL
				""")
				.setParameter("userId", userId)
				.executeUpdate();
	}

	private User toDomain(
			com.english_hub.backend.features.user.infrastructure.persistence.entity.User source) {
		TeacherProfile teacherProfile = source.getRole() == UserRole.TEACHER
				? teacherProfileJpaRepository.findById(source.getId()).orElse(null)
				: null;
		StudentProfile studentProfile = source.getRole() == UserRole.STUDENT
				? studentProfileJpaRepository.findById(source.getId()).orElse(null)
				: null;
		return mapper.toDomain(source, teacherProfile, studentProfile);
	}

	private void saveProfile(
			User source,
			com.english_hub.backend.features.user.infrastructure.persistence.entity.User savedUser) {
		if (source.role() == UserRole.TEACHER) {
			TeacherProfile profile = teacherProfileJpaRepository.findById(savedUser.getId())
					.orElseGet(() -> new TeacherProfile(savedUser, source.specialization()));
			profile.updateSpecialization(source.specialization());
			teacherProfileJpaRepository.save(profile);
		}
		if (source.role() == UserRole.STUDENT) {
			StudentProfile profile = studentProfileJpaRepository.findById(savedUser.getId())
					.orElseGet(() -> new StudentProfile(
							savedUser,
							source.studentCode(),
							source.dateOfBirth(),
							source.parentPhone()));
			profile.update(source.studentCode(), source.dateOfBirth(), source.parentPhone());
			studentProfileJpaRepository.save(profile);
		}
	}
}
