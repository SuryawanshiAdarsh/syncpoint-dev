package com.syncpoint.compliance.risk.dto;

import com.syncpoint.compliance.risk.entity.RiskCategory;
import com.syncpoint.compliance.risk.entity.RiskLevel;
import com.syncpoint.compliance.risk.entity.RiskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record RiskResponse(
        UUID id,
        String title,
        String description,
        RiskCategory category,
        RiskLevel likelihood,
        RiskLevel impact,
        int score,
        RiskStatus status,
        UUID ownerUserId,
        String ownerName,
        LocalDate nextReviewDate,
        List<UUID> linkedControlIds,
        List<String> linkedControlCodes,
        Instant createdAt,
        Instant updatedAt
) {
}
