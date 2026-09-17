package com.english_hub.backend.auth.entity;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "token_hash", nullable = false, length = 255, unique = true)
	private String tokenHash;

	@Column(name = "expires_at", nullable = false)
	private OffsetDateTime expiresAt;

	@Column(name = "revoked_at")
	private OffsetDateTime revokedAt;

	@Column(name = "user_agent", length = 255)
	private String userAgent;

	@Column(name = "ip_address", length = 45)
	private String ipAddress;

	public RefreshToken(
			Long userId,
			String tokenHash,
			OffsetDateTime expiresAt,
			OffsetDateTime revokedAt,
			String userAgent,
			String ipAddress) {
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
		this.revokedAt = revokedAt;
		this.userAgent = userAgent;
		this.ipAddress = ipAddress;
	}
}
