package com.syncpoint.compliance.evidence.dto;

import java.time.Instant;
import java.util.UUID;

public record EvidenceVersionResponse(
        UUID id,
        int version,
        long sizeBytes,
        String mimeType,
        String contentHash,
        Instant collectedAt,
        Instant createdAt
) {
}
