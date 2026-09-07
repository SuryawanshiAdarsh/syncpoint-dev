package com.syncpoint.compliance.policy.dto;

import java.util.UUID;

public record PolicyPortalDetailResponse(
        UUID id,
        String title,
        String category,
        String description,
        int currentVersion,
        String status,
        boolean hasDocument
) {
}
