package com.syncpoint.compliance.policy.service;

import com.syncpoint.compliance.common.exception.UnauthorizedException;
import com.syncpoint.compliance.policy.entity.PolicyAckToken;
import com.syncpoint.compliance.policy.repository.PolicyAckTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Issues and resolves the magic-link tokens backing the login-free policy acknowledgment
 * portal. Unlike {@code AuthTokenService}'s one-time tokens, these are multi-use until expiry —
 * a person may need to browse and acknowledge several policies across more than one visit.
 * Only a SHA-256 hash of the raw token is ever persisted.
 */
@Service
public class PolicyAckTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final PolicyAckTokenRepository tokens;

    public PolicyAckTokenService(PolicyAckTokenRepository tokens) {
        this.tokens = tokens;
    }

    /** Rotates: any prior token for this member is invalidated before issuing a fresh one. */
    @Transactional
    public String issue(UUID organizationId, UUID userId, Duration ttl) {
        tokens.deleteByOrganizationIdAndUserId(organizationId, userId);
        String raw = generateRaw();
        tokens.save(new PolicyAckToken(organizationId, userId, hash(raw), Instant.now().plus(ttl)));
        return raw;
    }

    @Transactional(readOnly = true)
    public PolicyAckToken resolve(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new UnauthorizedException("Invalid or expired link");
        }
        PolicyAckToken token = tokens.findByTokenHash(hash(rawToken))
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired link"));
        if (!token.isUsable(Instant.now())) {
            throw new UnauthorizedException("Invalid or expired link");
        }
        return token;
    }

    private static String generateRaw() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
