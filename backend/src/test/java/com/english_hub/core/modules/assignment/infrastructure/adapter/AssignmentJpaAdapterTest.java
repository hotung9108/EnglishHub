package com.english_hub.core.modules.assignment.infrastructure.adapter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

import com.english_hub.core.infrastructure.persistence.repository.AssignmentModuleRepository;
import com.english_hub.core.infrastructure.persistence.repository.AssignmentRepository;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
}
