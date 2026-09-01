package com.syncpoint.compliance.auth.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn
) {
    public static TokenResponse bearer(String access, String refresh, long expiresInSeconds) {
        return new TokenResponse(access, refresh, "Bearer", expiresInSeconds);
    }
}
