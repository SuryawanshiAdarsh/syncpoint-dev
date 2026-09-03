package com.syncpoint.compliance.collection.dto;

import com.syncpoint.compliance.collection.entity.CollectionRunStatus;
import com.syncpoint.compliance.collection.entity.CollectionTrigger;

import java.time.Instant;
import java.util.UUID;

public record CollectionRunResponse(
        UUID id,
        UUID integrationId,
        CollectionRunStatus status,
        CollectionTrigger trigger,
        Instant startedAt,
        Instant completedAt,
        String errorMessage,
        Instant createdAt,
        long itemsOk,
        long itemsFailed,
        long itemsTotal,
        Long durationMs
) {
}
