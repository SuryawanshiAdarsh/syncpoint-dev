package com.syncpoint.compliance.policy.dto;

import java.time.Instant;
import java.util.UUID;

public record PolicyAcknowledgmentResponse(
        UUID userId,
        String userName,
        String userEmail,
        Instant acknowledgedAt
) {
}
