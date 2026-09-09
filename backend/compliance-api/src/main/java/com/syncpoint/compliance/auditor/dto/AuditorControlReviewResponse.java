package com.syncpoint.compliance.auditor.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditorControlReviewResponse(
        UUID id,
        UUID controlId,
        String controlCode,
        String reviewedByName,
        Instant reviewedAt,
        String note
) {
}
