package com.english_hub.backend.common.persistence.repository;

import java.util.List;
import java.util.Optional;

/**
 * Base persistence contract shared across all aggregates.
 *
 * <p>A pure-Java collection interface. Domain repository ports may extend this
 * contract; infrastructure provides the actual persistence adapter.</p>
 *
 * @param <T>  the aggregate type
 * @param <ID> the aggregate identity type
 */
public interface BaseRepository<T, ID> {

	Optional<T> findById(ID id);

	List<T> findAll();

	boolean existsById(ID id);

	long count();

	T save(T entity);

	void deleteById(ID id);
}