package com.english_hub.core.modules.assignment.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

class AssignmentTest {

	private static final OffsetDateTime OPEN_AT = OffsetDateTime.parse("2026-09-15T00:00:00Z");
	private static final OffsetDateTime CLOSE_AT = OPEN_AT.plusDays(5);
	private static final OffsetDateTime NEW_CLOSE_AT = CLOSE_AT.plusDays(2);

	@ParameterizedTest(name = "replaces deadline: {0}")
	@ValueSource(booleans = {true, false})
	void reopensClosedAssignmentWithOptionalDeadline(boolean replacesDeadline) {
		Assignment assignment = assignmentWithStatus(AssignmentStatus.CLOSED);
		OffsetDateTime newCloseAt = replacesDeadline ? NEW_CLOSE_AT : null;

		assignment.reopen(newCloseAt);

		assertThat(assignment.status()).isEqualTo(AssignmentStatus.PUBLISHED);
		assertThat(assignment.closeAt()).isEqualTo(replacesDeadline ? NEW_CLOSE_AT : CLOSE_AT);
		assertThat(assignment).usingRecursiveComparison()
				.ignoringFields("status", "closeAt")
				.isEqualTo(assignmentWithStatus(AssignmentStatus.CLOSED));
	}

	@ParameterizedTest
	@EnumSource(value = AssignmentStatus.class, names = {"DRAFT", "PUBLISHED"})
	void rejectsReopenFromOtherStatusesWithoutChangingTheAssignment(AssignmentStatus status) {
		Assignment assignment = assignmentWithStatus(status);

		assertThatThrownBy(() -> assignment.reopen(NEW_CLOSE_AT))
				.isInstanceOf(IllegalStateException.class)
				.hasMessage("Invalid assignment status transition");
		assertThat(assignment).usingRecursiveComparison().isEqualTo(assignmentWithStatus(status));
	}

	@Test
	void regularStatusChangeStillRejectsClosedToPublished() {
		Assignment assignment = assignmentWithStatus(AssignmentStatus.CLOSED);

		assertThatThrownBy(() -> assignment.changeStatus(AssignmentStatus.PUBLISHED))
				.isInstanceOf(IllegalStateException.class)
				.hasMessage("Invalid assignment status transition");
		assertThat(assignment).usingRecursiveComparison().isEqualTo(assignmentWithStatus(AssignmentStatus.CLOSED));
	}

	@ParameterizedTest
	@CsvSource({
			"DRAFT, DRAFT, false",
			"DRAFT, PUBLISHED, true",
			"DRAFT, CLOSED, false",
			"PUBLISHED, DRAFT, false",
			"PUBLISHED, PUBLISHED, false",
			"PUBLISHED, CLOSED, true",
			"CLOSED, DRAFT, false",
			"CLOSED, PUBLISHED, true",
			"CLOSED, CLOSED, false"
	})
	void reportsAllowedTransition(AssignmentStatus current, AssignmentStatus next, boolean allowed) {
		assertThat(assignmentWithStatus(current).canTransitionTo(next)).isEqualTo(allowed);
	}

	private static Assignment assignmentWithStatus(AssignmentStatus status) {
		return new Assignment(1L, 2L, "Weekly quiz", "Reading practice", OPEN_AT, CLOSE_AT,
				3, status, false, OPEN_AT.toInstant(), CLOSE_AT.toInstant());
	}
}
