package com.english_hub.backend.common.application;

import java.util.List;
import java.util.Optional;

/**
 * Base CRUD contract for application services.
 *
 * <p>All I/O happens through the DTO type; implementing services map between
 * the domain entity and its DTO (typically via {@code IMapper}).</p>
 *
 * @param <TEntity> the domain entity type
 * @param <TDto>    the application DTO type
 */
public interface IService<TEntity, TDto> {

	List<TDto> findAll();

	Optional<TDto> findById(Long id);

	TDto create(TDto request);

	TDto update(Long id, TDto request);

	void delete(Long id);
}