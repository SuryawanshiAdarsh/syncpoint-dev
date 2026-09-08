package com.syncpoint.compliance.risk.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Full edit of a risk entry, including its linked controls (replaces the full set). */
public record UpdateRiskRequest(
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
