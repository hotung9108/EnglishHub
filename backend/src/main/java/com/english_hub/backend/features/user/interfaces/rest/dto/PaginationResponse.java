package com.english_hub.backend.features.user.interfaces.rest.dto;

public record PaginationResponse(int page, int limit, long total) {
}
