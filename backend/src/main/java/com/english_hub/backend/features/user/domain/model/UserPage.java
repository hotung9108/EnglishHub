package com.english_hub.backend.features.user.domain.model;

import java.util.List;

public record UserPage(List<User> users, int page, int limit, long total) {
}
