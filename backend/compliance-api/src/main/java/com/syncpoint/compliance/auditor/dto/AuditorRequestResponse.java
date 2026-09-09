package com.syncpoint.compliance.auditor.dto;

import com.syncpoint.compliance.auditor.entity.AuditorRequestStatus;
import com.syncpoint.compliance.auditor.entity.AuditorRequestType;

import java.time.Instant;
import java.util.UUID;

public record AuditorRequestResponse(
        UUID id,
        UUID controlId,
        String controlCode,
        String controlTitle,
        AuditorRequestType type,
        String message,
        AuditorRequestStatus status,
        String createdByName,
        Instant createdAt,
        String resolvedByName,
        Instant resolvedAt,
        String resolutionNote
) {
}
