package com.syncpoint.compliance.auth.service;

import com.syncpoint.compliance.config.JwtProperties;
import com.syncpoint.compliance.organization.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_REFRESH = "refresh";

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] secret = properties.secret().getBytes(StandardCharsets.UTF_8);
        if (secret.length < 32) {
            throw new IllegalStateException("syncpoint.jwt.secret must be at least 32 bytes");
        }
        this.signingKey = Keys.hmacShaKeyFor(secret);
    }

    public String createAccessToken(UUID userId, String email, UUID organizationId, Role role, boolean platformAdmin) {
        return build(userId, email, organizationId, role, platformAdmin, TYPE_ACCESS, properties.accessTokenExpiration().toSeconds());
    }

    public String createRefreshToken(UUID userId, String email, UUID organizationId, Role role, boolean platformAdmin) {
        return build(userId, email, organizationId, role, platformAdmin, TYPE_REFRESH, properties.refreshTokenExpiration().toSeconds());
    }

    public long accessTokenExpiresInSeconds() {
        return properties.accessTokenExpiration().toSeconds();
    }

    public Claims parseAccess(String token) {
        Claims claims = parse(token);
        if (!TYPE_ACCESS.equals(claims.get("typ", String.class))) {
            throw new io.jsonwebtoken.JwtException("expected access token");
        }
        return claims;
    }

    public Claims parseRefresh(String token) {
        Claims claims = parse(token);
        if (!TYPE_REFRESH.equals(claims.get("typ", String.class))) {
            throw new io.jsonwebtoken.JwtException("expected refresh token");
        }
        return claims;
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(properties.issuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String build(UUID userId, String email, UUID organizationId, Role role, boolean platformAdmin, String type, long expiresInSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .issuer(properties.issuer())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expiresInSeconds)))
                .claim("email", email)
                .claim("orgId", organizationId.toString())
                .claim("role", role.name())
                .claim("platformAdmin", platformAdmin)
                .claim("typ", type)
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }
}
