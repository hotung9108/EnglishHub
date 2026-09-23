package com.english_hub.core.modules.assignment.domain.model;

import com.english_hub.core.common.domain.BaseEntity;
import java.time.Instant;
import java.time.OffsetDateTime;

/**
 * Assignment aggregate root for the Assignment bounded context.
 *
 * <p>Class ownership is intentionally represented by {@code classId}. The
 * classroom context remains the source of truth for teacher ownership and
 * student membership.</p>
 */
public class Assignment extends BaseEntity<Long> {

	private Long classId;
	private String title;
	private String description;
	private OffsetDateTime openAt;
	private OffsetDateTime closeAt;
	private Integer maxSubmissions;
	private AssignmentStatus status;
	private boolean deleted;

	public Assignment(
			Long id,
			Long classId,
			String title,
			String description,
			OffsetDateTime openAt,
			OffsetDateTime closeAt,
			Integer maxSubmissions,
			AssignmentStatus status,
			boolean deleted,
			Instant createdAt,
			Instant updatedAt) {
		setId(id);
		setCreatedAt(createdAt);
		setUpdatedAt(updatedAt);
		this.classId = classId;
		this.title = title;
		this.description = description;
		this.openAt = openAt;
		this.closeAt = closeAt;
		this.maxSubmissions = maxSubmissions;
		this.status = status;
		this.deleted = deleted;
	}

	public static Assignment create(
			Long classId,
			String title,
			String description,
			OffsetDateTime openAt,
			OffsetDateTime closeAt,
			Integer maxSubmissions) {
		return new Assignment(
				null,
				classId,
				title,
				description,
				openAt,
				closeAt,
				maxSubmissions,
				AssignmentStatus.DRAFT,
				false,
				null,
				null);
	}

	public void updateDetails(
			String title,
			String description,
			OffsetDateTime openAt,
			OffsetDateTime closeAt,
			Integer maxSubmissions) {
		this.title = title;
		this.description = description;
		this.openAt = openAt;
		this.closeAt = closeAt;
		this.maxSubmissions = maxSubmissions;
	}

	public boolean canTransitionTo(AssignmentStatus nextStatus) {
		return (status == AssignmentStatus.DRAFT && nextStatus == AssignmentStatus.PUBLISHED)
				|| (status == AssignmentStatus.PUBLISHED && nextStatus == AssignmentStatus.CLOSED);
	}

	public void changeStatus(AssignmentStatus nextStatus) {
		if (!canTransitionTo(nextStatus)) {
			throw new IllegalStateException("Invalid assignment status transition");
		}
		status = nextStatus;
	}

	public void softDelete() {
		deleted = true;
	}

	public Long id() {
		return getId();
	}

	public Long classId() {
		return classId;
	}

	public String title() {
		return title;
	}

	public String description() {
		return description;
	}

	public OffsetDateTime openAt() {
		return openAt;
	}

	public OffsetDateTime closeAt() {
		return closeAt;
	}

	public Integer maxSubmissions() {
		return maxSubmissions;
	}

	public AssignmentStatus status() {
		return status;
	}

	public boolean deleted() {
		return deleted;
	}
}
