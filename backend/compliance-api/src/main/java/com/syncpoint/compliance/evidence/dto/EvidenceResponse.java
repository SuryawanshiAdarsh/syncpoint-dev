package com.syncpoint.compliance.evidence.dto;

import com.syncpoint.compliance.evidence.entity.EvidenceSourceType;
import com.syncpoint.compliance.evidence.entity.EvidenceStatus;

import java.time.Instant;
import java.util.UUID;

public record EvidenceResponse(
        UUID id,
        String name,
        String description,
        EvidenceSourceType sourceType,
        String sourceSystem,
        EvidenceStatus status,
        FreshnessState freshness,
        Instant collectedAt,
        Instant expiresAt,
        Integer latestVersion,
        String contentHash,
        Long sizeBytes,
        String mimeType,
        Instant createdAt
) {
    public enum FreshnessState { CURRENT, EXPIRING, EXPIRED }
}
