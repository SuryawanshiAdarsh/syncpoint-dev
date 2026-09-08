package com.syncpoint.compliance.risk.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateRiskRequest(
        String title,
        String description,
        String category,
        String likelihood,
        String impact,
        UUID ownerUserId,
        LocalDate nextReviewDate,
        List<UUID> controlIds
) {
}
