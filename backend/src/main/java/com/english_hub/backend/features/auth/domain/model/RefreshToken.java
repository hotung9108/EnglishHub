package com.english_hub.backend.features.auth.domain.model;

import com.english_hub.backend.common.domain.BaseEntity;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Refresh session record.
 *
 * <p>Only the SHA-256 hash of the client token is persisted ({@code tokenHash});
 * the raw token is never stored.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken extends BaseEntity<Long> {

	private Long userId;

	private String tokenHash;

	private Instant expiresAt;

	private Instant revokedAt;

	private String userAgent;

	private String ipAddress;
}