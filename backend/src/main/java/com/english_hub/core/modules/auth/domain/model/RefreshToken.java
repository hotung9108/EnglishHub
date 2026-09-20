package com.english_hub.core.modules.auth.domain.model;

import com.english_hub.core.common.domain.BaseEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Refresh session record.
 *
 * <p>Only the SHA-256 hash of the client token is persisted ({@code tokenHash});
 * the raw token is never stored.</p>
 */
@Getter
@Setter
@Builder
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