package com.syncpoint.compliance.policy.dto;

import java.time.Instant;
import java.util.UUID;

public record PolicyPortalItemResponse(
        UUID id,
        String title,
        String category,
        int currentVersion,
        String status,
        Instant acknowledgedAt
) {
}
