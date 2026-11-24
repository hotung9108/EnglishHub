package com.english_hub.core.modules.assignment.infrastructure.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
import com.english_hub.core.modules.assignment.application.page.AssignmentPageRequest;
import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentPage;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.assignment.infrastructure.mapper.AssignmentPersistenceMapper;
import com.english_hub.core.modules.assignment.infrastructure.mapper.AssignmentSkillPersistenceMapper;
import com.english_hub.core.modules.assignment.infrastructure.persistence.projection.AssignmentSkillProjection;
import com.english_hub.core.modules.assignment.infrastructure.persistence.repository.AssignmentSkillJpaRepository;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class AssignmentJpaAdapterTest {

	@Mock
	private AssignmentRepository jpaRepository;

	@Mock
	private AssignmentModuleRepository assignmentModuleRepository;

	@Mock
	private AssignmentPersistenceMapper mapper;

	@Mock
	private AssignmentSkillJpaRepository assignmentSkillJpaRepository;

	@Mock
	private AssignmentSkillPersistenceMapper skillMapper;

	private AssignmentJpaAdapter adapter;

	@BeforeEach
	void setUp() {
		adapter = new AssignmentJpaAdapter(
				jpaRepository, assignmentModuleRepository, mapper, assignmentSkillJpaRepository, skillMapper);
	}

	@Test
	void findSkillsUsesSingleBatchQuery() {
		List<Long> assignmentIds = List.of(1L, 2L);
		List<AssignmentSkillProjection> modules = List.of(mock(AssignmentSkillProjection.class));
		Map<Long, List<ModuleSkill>> expected = Map.of(1L, List.of(ModuleSkill.READING, ModuleSkill.LISTENING));
		when(assignmentSkillJpaRepository.findByAssignmentIdInOrderByAssignmentIdAscOrderIndexAscIdAsc(assignmentIds))
				.thenReturn(modules);
		when(skillMapper.toSkillsByAssignmentId(modules)).thenReturn(expected);

		Map<Long, List<ModuleSkill>> result = adapter.findSkillsByAssignmentIds(assignmentIds);

		assertThat(result).isSameAs(expected);
		verify(assignmentSkillJpaRepository, times(1))
				.findByAssignmentIdInOrderByAssignmentIdAscOrderIndexAscIdAsc(assignmentIds);
		verify(skillMapper).toSkillsByAssignmentId(modules);
		verify(assignmentModuleRepository, never()).findByAssignmentIdOrderByOrderIndexAsc(any());
		verifyNoMoreInteractions(assignmentSkillJpaRepository, skillMapper);
		verifyNoInteractions(jpaRepository, assignmentModuleRepository, mapper);
	}

	@Test
	void emptyIdsDoNotCallJpaRepository() {
		Map<Long, List<ModuleSkill>> result = adapter.findSkillsByAssignmentIds(List.of());

		assertThat(result).isEmpty();
		verifyNoInteractions(assignmentSkillJpaRepository, skillMapper, jpaRepository, assignmentModuleRepository, mapper);
	}

	@Test
	void findPageExcludingDraftUsesRequestedPage() {
		long classId = 1L;
		AssignmentPageRequest pageRequest = new AssignmentPageRequest(1, 20);
		when(jpaRepository.findPageExcludingStatusWithTotalElements(any(), any(), any()))
				.thenReturn(List.of());

		adapter.findPageExcludingDraft(classId, pageRequest);

		ArgumentCaptor<com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus> statusCaptor =
				ArgumentCaptor.forClass(com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.class);
		ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
		verify(jpaRepository).findPageExcludingStatusWithTotalElements(
				eq(classId), statusCaptor.capture(), pageableCaptor.capture());
		assertThat(statusCaptor.getValue())
				.isEqualTo(com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.DRAFT);
		assertThat(pageableCaptor.getValue().getPageNumber()).isZero();
		assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(20);
		verifyNoMoreInteractions(jpaRepository);
		verifyNoInteractions(mapper, assignmentModuleRepository, assignmentSkillJpaRepository, skillMapper);
	}

	@ParameterizedTest
	@CsvSource({
		"ALL_STATUSES, 1",
		"ALL_STATUSES, 3",
		"FILTERED_STATUS, 1",
		"FILTERED_STATUS, 3",
		"EXCLUDING_DRAFT, 1",
		"EXCLUDING_DRAFT, 3"
	})
	void pageVariantsPreserveMappingAndWindowTotal(PageVariant variant, int page) {
		long classId = 1L;
		int limit = 2;
		long total = 7L;
		AssignmentPageRequest pageRequest = new AssignmentPageRequest(page, limit);
		var firstEntity = mock(com.english_hub.core.infrastructure.persistence.entity.Assignment.class);
		var secondEntity = mock(com.english_hub.core.infrastructure.persistence.entity.Assignment.class);
		Assignment firstAssignment = mock(Assignment.class);
		Assignment secondAssignment = mock(Assignment.class);
		when(firstAssignment.id()).thenReturn(4L);
		when(secondAssignment.id()).thenReturn(3L);
		when(mapper.toDomain(firstEntity)).thenReturn(firstAssignment);
		when(mapper.toDomain(secondEntity)).thenReturn(secondAssignment);
		List<Object[]> rows = List.of(new Object[] {firstEntity, total}, new Object[] {secondEntity, total});

		AssignmentPage result = loadPageWithRows(variant, classId, pageRequest, rows);

		assertThat(result.assignments()).containsExactly(firstAssignment, secondAssignment);
		assertThat(result.assignments()).extracting(Assignment::id).containsExactly(4L, 3L);
		assertThat(result.total()).isEqualTo(total);
		assertThat(result.page()).isEqualTo(page);
		assertThat(result.limit()).isEqualTo(limit);
		Pageable pageable = verifyPageQuery(variant, classId);
		assertThat(pageable.getPageNumber()).isEqualTo(page - 1);
		assertThat(pageable.getPageSize()).isEqualTo(limit);
		verify(mapper).toDomain(firstEntity);
		verify(mapper).toDomain(secondEntity);
		verifyNoMoreInteractions(mapper);
		verifyNoInteractions(assignmentModuleRepository, assignmentSkillJpaRepository, skillMapper);
	}

	@ParameterizedTest
	@EnumSource(PageVariant.class)
	void emptyPageVariantsKeepZeroTotal(PageVariant variant) {
		long classId = 1L;
		AssignmentPageRequest pageRequest = new AssignmentPageRequest(1, 20);

		AssignmentPage result = loadPageWithRows(variant, classId, pageRequest, List.of());

		assertThat(result.assignments()).isEmpty();
		assertThat(result.total()).isZero();
		assertThat(result.page()).isEqualTo(1);
		assertThat(result.limit()).isEqualTo(20);
		Pageable pageable = verifyPageQuery(variant, classId);
		assertThat(pageable.getPageNumber()).isZero();
		assertThat(pageable.getPageSize()).isEqualTo(20);
		verifyNoInteractions(mapper, assignmentModuleRepository, assignmentSkillJpaRepository, skillMapper);
	}

	private AssignmentPage loadPageWithRows(
			PageVariant variant, Long classId, AssignmentPageRequest pageRequest, List<Object[]> rows) {
		switch (variant) {
			case ALL_STATUSES:
				when(jpaRepository.findPageWithTotalElements(eq(classId), any(Pageable.class))).thenReturn(rows);
				return adapter.findPage(classId, null, pageRequest);
			case FILTERED_STATUS:
				when(jpaRepository.findPageWithStatusAndTotalElements(
						eq(classId),
						eq(com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.PUBLISHED),
						any(Pageable.class))).thenReturn(rows);
				return adapter.findPage(classId, AssignmentStatus.PUBLISHED, pageRequest);
			case EXCLUDING_DRAFT:
				when(jpaRepository.findPageExcludingStatusWithTotalElements(
						eq(classId),
						eq(com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.DRAFT),
						any(Pageable.class))).thenReturn(rows);
				return adapter.findPageExcludingDraft(classId, pageRequest);
			default:
				throw new IllegalArgumentException("Unsupported page variant: " + variant);
		}
	}

	private Pageable verifyPageQuery(PageVariant variant, Long classId) {
		ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
		switch (variant) {
			case ALL_STATUSES:
				verify(jpaRepository).findPageWithTotalElements(eq(classId), pageableCaptor.capture());
				break;
			case FILTERED_STATUS:
				verify(jpaRepository).findPageWithStatusAndTotalElements(
						eq(classId),
						eq(com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.PUBLISHED),
						pageableCaptor.capture());
				break;
			case EXCLUDING_DRAFT:
				verify(jpaRepository).findPageExcludingStatusWithTotalElements(
						eq(classId),
						eq(com.english_hub.core.infrastructure.persistence.entity.AssignmentStatus.DRAFT),
						pageableCaptor.capture());
				break;
			default:
				throw new IllegalArgumentException("Unsupported page variant: " + variant);
		}
		verifyNoMoreInteractions(jpaRepository);
		return pageableCaptor.getValue();
	}

	private enum PageVariant {
		ALL_STATUSES,
		FILTERED_STATUS,
		EXCLUDING_DRAFT
	}
}
