package com.english_hub.core.common.application;

import lombok.Getter;
import lombok.Setter;

/**
 * Base contract for DTOs exposed by the application layer.
 *
 * <p>Feature DTOs may extend this class to inherit the identity field.</p>
 *
 * @param <TId> the identity type
 */
@Getter
@Setter
public class BaseDto<TId> {

	private TId id;
}