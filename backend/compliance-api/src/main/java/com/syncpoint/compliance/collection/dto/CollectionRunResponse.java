package com.syncpoint.compliance.collection.dto;

import com.syncpoint.compliance.collection.entity.CollectionRunStatus;

import java.time.Instant;
import java.util.UUID;

public record CollectionRunResponse(
        UUID id,
        UUID integrationId,
        CollectionRunStatus status,
        Instant startedAt,
        Instant completedAt,
        String errorMessage,
        Instant createdAt
) {
}
