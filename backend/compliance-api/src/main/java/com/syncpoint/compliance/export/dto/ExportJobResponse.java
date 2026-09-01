package com.syncpoint.compliance.export.dto;

import com.syncpoint.compliance.export.entity.ExportJobStatus;

import java.time.Instant;
import java.util.UUID;

public record ExportJobResponse(
        UUID id,
        ExportJobStatus status,
        Long sizeBytes,
        String downloadPath,
        String errorMessage,
        Instant startedAt,
        Instant completedAt,
        Instant createdAt
) {
}
