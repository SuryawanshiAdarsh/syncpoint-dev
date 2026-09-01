package com.syncpoint.compliance.collection.dto;

import com.syncpoint.compliance.collection.entity.CollectionItemStatus;

import java.time.Instant;
import java.util.UUID;

public record CollectionItemResponse(
        UUID id,
        String evidenceType,
        CollectionItemStatus status,
        String message,
        UUID evidenceId,
        Instant createdAt
) {
}
