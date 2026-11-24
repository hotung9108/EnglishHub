package com.english_hub.core.modules.assignment.infrastructure.mapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.english_hub.core.modules.assignment.infrastructure.persistence.projection.AssignmentSkillProjection;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AssignmentSkillPersistenceMapperTest {

	private final AssignmentSkillPersistenceMapper mapper = new AssignmentSkillPersistenceMapper();

	@Test
	void groupsSkillsByAssignmentId() {
		List<AssignmentSkillProjection> modules = List.of(
				module(1L, ModuleSkill.READING),
				module(1L, ModuleSkill.LISTENING),
				module(2L, ModuleSkill.SPEAKING));

		Map<Long, List<ModuleSkill>> result = mapper.toSkillsByAssignmentId(modules);

		assertThat(result).hasSize(2);
		assertThat(result.get(1L)).containsExactly(ModuleSkill.READING, ModuleSkill.LISTENING);
		assertThat(result.get(2L)).containsExactly(ModuleSkill.SPEAKING);
	}

	@Test
	void deduplicatesSkillsKeepingFirstOrder() {
		List<AssignmentSkillProjection> modules = List.of(
				module(1L, ModuleSkill.LISTENING),
				module(1L, ModuleSkill.READING),
				module(1L, ModuleSkill.LISTENING),
				module(1L, ModuleSkill.WRITING),
				module(1L, ModuleSkill.READING));

		Map<Long, List<ModuleSkill>> result = mapper.toSkillsByAssignmentId(modules);

		assertThat(result.get(1L)).containsExactly(ModuleSkill.LISTENING, ModuleSkill.READING, ModuleSkill.WRITING);
	}

	@Test
	void keepsRepositoryOrder() {
		List<AssignmentSkillProjection> modules = List.of(
				module(1L, ModuleSkill.SPEAKING),
				module(1L, ModuleSkill.WRITING),
				module(1L, ModuleSkill.LISTENING),
				module(1L, ModuleSkill.READING));

		Map<Long, List<ModuleSkill>> result = mapper.toSkillsByAssignmentId(modules);

		assertThat(result.get(1L)).containsExactly(
				ModuleSkill.SPEAKING, ModuleSkill.WRITING, ModuleSkill.LISTENING, ModuleSkill.READING);
	}

	@Test
	void emptyInputProducesEmptyMap() {
		assertThat(mapper.toSkillsByAssignmentId(List.of())).isEmpty();
	}

	@Test
	void mapsEntityEnumToDomainEnum() {
		List<AssignmentSkillProjection> modules = List.of(
				module(1L, ModuleSkill.READING),
				module(1L, ModuleSkill.LISTENING),
				module(1L, ModuleSkill.WRITING),
				module(1L, ModuleSkill.SPEAKING));

		Map<Long, List<ModuleSkill>> result = mapper.toSkillsByAssignmentId(modules);

		assertThat(result.get(1L)).containsExactly(ModuleSkill.values());
	}

	@Test
	void returnsImmutableSkillLists() {
		Map<Long, List<ModuleSkill>> result = mapper.toSkillsByAssignmentId(List.of(module(1L, ModuleSkill.READING)));

		assertThatThrownBy(() -> result.get(1L).add(ModuleSkill.WRITING))
				.isInstanceOf(UnsupportedOperationException.class);
	}

	private AssignmentSkillProjection module(Long assignmentId, ModuleSkill skill) {
		AssignmentSkillProjection projection = mock(AssignmentSkillProjection.class);
		when(projection.getAssignmentId()).thenReturn(assignmentId);
		when(projection.getSkill()).thenReturn(
				com.english_hub.core.infrastructure.persistence.entity.ModuleSkill.valueOf(skill.name()));
		return projection;
	}
}
