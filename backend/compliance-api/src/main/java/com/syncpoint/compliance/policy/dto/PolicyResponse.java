package com.syncpoint.compliance.policy.dto;

import com.syncpoint.compliance.policy.entity.PolicyStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PolicyResponse(
        UUID id,
        String title,
        String category,
        String description,
        PolicyStatus status,
        UUID ownerUserId,
        String ownerName,
        LocalDate nextReviewDate,
        int currentVersion,
        UUID evidenceId,
        List<String> mappedControlCodes,
        int acknowledgedCount,
        int totalMembers,
        boolean acknowledgedByMe,
        Instant createdAt,
        Instant updatedAt
) {
}
