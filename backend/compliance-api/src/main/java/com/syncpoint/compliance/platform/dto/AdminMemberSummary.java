package com.syncpoint.compliance.platform.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminMemberSummary(
        UUID userId,
        String name,
        String email,
        String role,
        Instant joinedAt
) {
}
