package com.english_hub.core.infrastructure.security;

import com.english_hub.core.features.user.domain.model.UserRole;

public record JwtPrincipal(long userId, UserRole role) {
}
