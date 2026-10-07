package com.english_hub.core.modules.auth.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

import org.springframework.data.annotation.CreatedDate;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshTokenJpaEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "token_hash", nullable = false, length = 255)
	private String tokenHash;

	@Column(name = "expires_at", nullable = false)
	private OffsetDateTime expiresAt;

	@Column(name = "revoked_at")
	private OffsetDateTime revokedAt;

	@Column(name = "user_agent", length = 255)
	private String userAgent;

	@Column(name = "ip_address", length = 45)
	private String ipAddress;

	@CreatedDate
	@Column(name = "created_at", nullable = false, updatable = false)
	private OffsetDateTime createdAt;

	public RefreshTokenJpaEntity(
			Long userId,
			String tokenHash,
			OffsetDateTime expiresAt,
			String userAgent,
			String ipAddress) {
		this.userId = userId;
		this.tokenHash = tokenHash;
		this.expiresAt = expiresAt;
		this.userAgent = userAgent;
		this.ipAddress = ipAddress;
	}

	public void updateFrom(
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

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = OffsetDateTime.now();
		}
	}
}
