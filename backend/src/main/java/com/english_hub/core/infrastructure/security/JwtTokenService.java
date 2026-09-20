package com.english_hub.core.infrastructure.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.english_hub.core.modules.user.domain.model.UserRole;

import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtTokenService {

	private static final String ALGORITHM = "HmacSHA256";
	private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
	private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

	private final ObjectMapper objectMapper;
	private final byte[] secret;
	private final String issuer;
	private final long accessTokenTtlSeconds;
	private final Clock clock;

	@Autowired
	public JwtTokenService(
			ObjectMapper objectMapper,
			@Value("${app.security.jwt-secret}") String secret,
			@Value("${app.security.jwt-issuer:englishhub}") String issuer,
			@Value("${app.security.access-token-ttl-seconds:900}") long accessTokenTtlSeconds) {
		this(objectMapper, secret, issuer, accessTokenTtlSeconds, Clock.systemUTC());
	}

	JwtTokenService(ObjectMapper objectMapper, String secret, String issuer, long accessTokenTtlSeconds, Clock clock) {
		if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
			throw new IllegalArgumentException("JWT secret must contain at least 32 UTF-8 bytes");
		}
		this.objectMapper = objectMapper;
		this.secret = secret.getBytes(StandardCharsets.UTF_8);
		this.issuer = issuer;
		this.accessTokenTtlSeconds = accessTokenTtlSeconds;
		this.clock = clock;
	}

	public String createAccessToken(long userId, UserRole role) {
		long issuedAt = Instant.now(clock).getEpochSecond();
		Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
		Map<String, Object> payload = new HashMap<>();
		payload.put("sub", Long.toString(userId));
		payload.put("role", role.name());
		payload.put("iss", issuer);
		payload.put("iat", issuedAt);
		payload.put("exp", issuedAt + accessTokenTtlSeconds);

		String encodedHeader = encodeJson(header);
		String encodedPayload = encodeJson(payload);
		String unsignedToken = encodedHeader + "." + encodedPayload;
		return unsignedToken + "." + sign(unsignedToken);
	}

	public Optional<JwtPrincipal> parse(String token) {
		try {
			String[] parts = token.split("\\.", -1);
			if (parts.length != 3) {
				return Optional.empty();
			}
			Map<String, Object> header = objectMapper.readValue(
					new String(BASE64_URL_DECODER.decode(parts[0]), StandardCharsets.UTF_8),
					new TypeReference<>() {
					});
			if (!"HS256".equals(header.get("alg"))) {
				return Optional.empty();
			}

			String unsignedToken = parts[0] + "." + parts[1];
			byte[] actualSignature = BASE64_URL_DECODER.decode(parts[2]);
			byte[] expectedSignature = Base64.getUrlDecoder().decode(sign(unsignedToken));
			if (!MessageDigest.isEqual(actualSignature, expectedSignature)) {
				return Optional.empty();
			}

			Map<String, Object> payload = objectMapper.readValue(
					new String(BASE64_URL_DECODER.decode(parts[1]), StandardCharsets.UTF_8),
					new TypeReference<>() {
					});
			if (!issuer.equals(payload.get("iss"))) {
				return Optional.empty();
			}
			long expiration = asLong(payload.get("exp"));
			if (expiration <= Instant.now(clock).getEpochSecond()) {
				return Optional.empty();
			}
			long userId = Long.parseLong(String.valueOf(payload.get("sub")));
			UserRole role = UserRole.fromTokenValue(String.valueOf(payload.get("role")));
			return Optional.of(new JwtPrincipal(userId, role));
		} catch (Exception exception) {
			return Optional.empty();
		}
	}

	private String encodeJson(Object value) {
		try {
			return BASE64_URL_ENCODER.encodeToString(objectMapper.writeValueAsBytes(value));
		} catch (JacksonException exception) {
			throw new IllegalStateException("Unable to create access token", exception);
		}
	}

	private String sign(String value) {
		try {
			Mac mac = Mac.getInstance(ALGORITHM);
			mac.init(new SecretKeySpec(secret, ALGORITHM));
			return BASE64_URL_ENCODER.encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
		} catch (Exception exception) {
			throw new IllegalStateException("Unable to sign access token", exception);
		}
	}

	private long asLong(Object value) {
		if (value instanceof Number number) {
			return number.longValue();
		}
		return Long.parseLong(String.valueOf(value));
	}
}
