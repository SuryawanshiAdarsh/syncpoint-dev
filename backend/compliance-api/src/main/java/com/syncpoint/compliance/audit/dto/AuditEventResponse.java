package com.syncpoint.compliance.audit.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditEventResponse(
        UUID id,
        String eventType,
        String entityType,
        UUID entityId,
        UUID actorUserId,
        String actorName,
        String actorEmail,
        Map<String, Object> metadata,
        Instant createdAt
) {
}
