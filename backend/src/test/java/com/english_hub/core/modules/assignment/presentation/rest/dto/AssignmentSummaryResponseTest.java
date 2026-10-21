package com.english_hub.core.modules.assignment.presentation.rest.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.english_hub.core.modules.assignment.domain.model.Assignment;
import com.english_hub.core.modules.assignment.domain.model.AssignmentStatus;
import com.english_hub.core.modules.module.domain.model.ModuleSkill;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

class AssignmentSummaryResponseTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OffsetDateTime.parse("2026-09-20T23:59:00Z");
	private final JsonMapper objectMapper = JsonMapper.builder().build();

	@Test
	void mapsAllSkillsAndLegacyFields() {
		List<ModuleSkill> skills = List.of(
				ModuleSkill.SPEAKING, ModuleSkill.READING, ModuleSkill.WRITING, ModuleSkill.LISTENING);

		AssignmentSummaryResponse response = AssignmentSummaryResponse.from(assignment(), skills);

		assertThat(response.id()).isEqualTo(5L);
		assertThat(response.title()).isEqualTo("Weekly Test 1");
		assertThat(response.status()).isEqualTo("PUBLISHED");
		assertThat(response.closeAt()).isEqualTo(CLOSE_AT);
		assertThat(response.skills()).containsExactlyElementsOf(skills);
	}

	@Test
	void mapsEmptySkillsAsEmptyArray() {
		AssignmentSummaryResponse response = AssignmentSummaryResponse.from(assignment(), List.of());

		assertThat(response.skills()).isNotNull().isEmpty();
		assertThat(objectMapper.valueToTree(response).get("skills").isArray()).isTrue();
		assertThat(objectMapper.valueToTree(response).get("skills").size()).isZero();
	}

	@Test
	void normalizesNullSkillsToEmptyArray() {
		AssignmentSummaryResponse response = AssignmentSummaryResponse.from(assignment(), null);

		assertThat(response.skills()).isNotNull().isEmpty();
		assertThat(objectMapper.valueToTree(response).get("skills").isArray()).isTrue();
	}

	@Test
	void serializesSkillsAsExactEnumNames() {
		AssignmentSummaryResponse response = AssignmentSummaryResponse.from(assignment(), List.of(
				ModuleSkill.READING, ModuleSkill.LISTENING, ModuleSkill.WRITING, ModuleSkill.SPEAKING));

		var json = objectMapper.readTree(objectMapper.writeValueAsString(response));

		assertThat(json.size()).isEqualTo(5);
		assertThat(json.get("id").asLong()).isEqualTo(5L);
		assertThat(json.get("title").asString()).isEqualTo("Weekly Test 1");
		assertThat(json.get("status").asString()).isEqualTo("PUBLISHED");
		assertThat(OffsetDateTime.parse(json.get("closeAt").asString())).isEqualTo(CLOSE_AT);
		var skills = json.get("skills");
		assertThat(skills.isArray()).isTrue();
		assertThat(skills.size()).isEqualTo(4);
		assertThat(skills.get(0).asString()).isEqualTo("READING");
		assertThat(skills.get(1).asString()).isEqualTo("LISTENING");
		assertThat(skills.get(2).asString()).isEqualTo("WRITING");
		assertThat(skills.get(3).asString()).isEqualTo("SPEAKING");
	}

	@Test
	void copiesSkillsToKeepResponseStable() {
		List<ModuleSkill> skills = new ArrayList<>(List.of(ModuleSkill.READING));
		AssignmentSummaryResponse response = AssignmentSummaryResponse.from(assignment(), skills);

		skills.add(ModuleSkill.WRITING);

		assertThat(response.skills()).containsExactly(ModuleSkill.READING);
	}

	private Assignment assignment() {
		return new Assignment(5L, 3L, "Weekly Test 1", "Instructions", OPEN_AT, CLOSE_AT,
				2, AssignmentStatus.PUBLISHED, false, null, null);
	}
}
