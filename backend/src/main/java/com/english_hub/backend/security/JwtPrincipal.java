package com.english_hub.backend.security;

import com.english_hub.backend.features.user.domain.model.UserRole;

public record JwtPrincipal(long userId, UserRole role) {
}
