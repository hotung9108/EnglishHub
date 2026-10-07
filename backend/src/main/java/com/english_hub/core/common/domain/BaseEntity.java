package com.english_hub.core.common.domain;

import java.time.Instant;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

/**
 * Base contract for aggregate roots and entities across all bounded contexts.
 *
 * <p>Deliberately framework-free: features may extend this class and add their
 * own business behaviour (rich domain model).</p>
 *
 * @param <TId> the identity type
 */
@Getter
@Setter
@Data
public abstract class BaseEntity<TId> {

	protected TId id;

	protected Instant createdAt;

	protected Instant updatedAt;
}