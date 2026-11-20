package com.english_hub.core.modules.user.domain.event;

import java.time.Instant;

public record AdminUserPasswordResetEvent(long adminId, long targetUserId, Instant occurredAt) {
}
