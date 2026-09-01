package com.syncpoint.compliance.integrations.dto;

import com.syncpoint.compliance.integrations.entity.IntegrationProvider;

import java.time.Instant;

public record TestConnectionResponse(
        boolean ok,
        IntegrationProvider provider,
        String message,
        Instant testedAt
) {
}
