package com.syncpoint.compliance.integrations.dto;

import com.syncpoint.compliance.integrations.entity.IntegrationProvider;
import com.syncpoint.compliance.integrations.entity.IntegrationSchedule;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record IntegrationResponse(
        UUID id,
        IntegrationProvider provider,
        IntegrationStatus status,
        String displayName,
        Map<String, Object> configuration,
        IntegrationSchedule schedule,
        Instant lastTestedAt,
        String lastTestMessage,
        Instant lastCollectionAt,
        Instant createdAt
) {
}
