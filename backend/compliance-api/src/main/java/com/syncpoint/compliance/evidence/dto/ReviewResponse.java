package com.syncpoint.compliance.evidence.dto;

import com.syncpoint.compliance.evidence.entity.ReviewDecision;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID evidenceId,
        UUID reviewerId,
        ReviewDecision decision,
        String comments,
        Instant reviewedAt
) {
}
