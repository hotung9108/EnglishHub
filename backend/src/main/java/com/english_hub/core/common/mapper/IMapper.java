package com.english_hub.core.common.mapper;

/**
 * Base contract for mapping between domain entities and DTOs.
 *
 * @param <TSource> the source type
 * @param <TDest>   the destination type
 */
public interface IMapper<TSource, TDest> {

	TDest toDto(TSource source);

	TSource toEntity(TDest dto);
}