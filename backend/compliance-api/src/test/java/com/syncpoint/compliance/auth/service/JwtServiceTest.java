package com.syncpoint.compliance.auth.service;

import com.syncpoint.compliance.config.JwtProperties;
import com.syncpoint.compliance.organization.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private final JwtProperties props = new JwtProperties(
            "unit-test-secret-that-is-definitely-long-enough-32bytes-and-more",
            Duration.ofMinutes(15),
            Duration.ofDays(1),
            "syncpoint-test");

    private final JwtService service = new JwtService(props);

    @Test
    void access_token_roundtrips_with_all_claims() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();

        String token = service.createAccessToken(userId, "alice@example.com", orgId, Role.OWNER, true);
        Claims claims = service.parseAccess(token);

        assertThat(claims.getSubject()).isEqualTo(userId.toString());
        assertThat(claims.get("email", String.class)).isEqualTo("alice@example.com");
        assertThat(claims.get("orgId", String.class)).isEqualTo(orgId.toString());
        assertThat(claims.get("role", String.class)).isEqualTo("OWNER");
        assertThat(claims.get("typ", String.class)).isEqualTo("access");
        assertThat(claims.get("platformAdmin", Boolean.class)).isTrue();
        assertThat(claims.getIssuer()).isEqualTo("syncpoint-test");
    }

    @Test
    void refresh_token_cannot_be_parsed_as_access() {
        String refresh = service.createRefreshToken(UUID.randomUUID(), "x@y", UUID.randomUUID(), Role.VIEWER, false);
        assertThatThrownBy(() -> service.parseAccess(refresh)).isInstanceOf(JwtException.class);
    }

    @Test
    void tampered_token_is_rejected() {
        String token = service.createAccessToken(UUID.randomUUID(), "x@y", UUID.randomUUID(), Role.VIEWER, false);
        String tampered = token.substring(0, token.length() - 4) + "AAAA";
        assertThatThrownBy(() -> service.parseAccess(tampered)).isInstanceOf(JwtException.class);
    }

    @Test
    void short_secret_is_rejected_at_construction() {
        JwtProperties bad = new JwtProperties("too-short", Duration.ofMinutes(1), Duration.ofMinutes(1), "iss");
        assertThatThrownBy(() -> new JwtService(bad)).isInstanceOf(IllegalStateException.class);
    }
}
