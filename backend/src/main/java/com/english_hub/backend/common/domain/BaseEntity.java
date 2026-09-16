package com.english_hub.backend.common.domain;

import java.time.Instant;
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
public abstract class BaseEntity<TId> {

	private TId id;

	private Instant createdAt;

	private Instant updatedAt;
}