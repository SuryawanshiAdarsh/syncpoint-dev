package com.syncpoint.compliance.auth.service;

import com.syncpoint.compliance.auth.entity.AuthToken;
import com.syncpoint.compliance.auth.entity.TokenPurpose;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.AuthTokenRepository;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.exception.UnauthorizedException;
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
import java.util.List;
import java.util.UUID;

/**
 * Issues and consumes the one-time emailed tokens backing password reset, member invites, and
 * email verification. Only a SHA-256 hash of the raw token is ever persisted — the raw value
 * exists only in the emailed link and the caller's response, never in the database.
 */
@Service
public class AuthTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AuthTokenRepository tokens;
    private final UserRepository users;

    public AuthTokenService(AuthTokenRepository tokens, UserRepository users) {
        this.tokens = tokens;
        this.users = users;
    }

    /** Invalidates any prior unused token of the same purpose for this user, then issues a fresh one. */
    @Transactional
    public String issue(UUID userId, TokenPurpose purpose, Duration ttl) {
        List<AuthToken> stale = tokens.findByUserIdAndPurpose(userId, purpose).stream()
                .filter(t -> t.getUsedAt() == null)
                .toList();
        tokens.deleteAll(stale);

        String raw = generateRaw();
        tokens.save(new AuthToken(userId, hash(raw), purpose, Instant.now().plus(ttl)));
        return raw;
    }

    @Transactional
    public User consume(String rawToken, TokenPurpose expectedPurpose) {
        AuthToken token = tokens.findByTokenHash(hash(rawToken))
                .filter(t -> t.getPurpose() == expectedPurpose)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired token"));
        if (!token.isUsable(Instant.now())) {
            throw new UnauthorizedException("Invalid or expired token");
        }
        token.markUsed();
        tokens.save(token);
        return users.findById(token.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found"));
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
