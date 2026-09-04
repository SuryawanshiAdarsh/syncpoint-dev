package com.syncpoint.compliance.platform.dto;

import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;

import java.time.Instant;
import java.util.UUID;

public record AdminOrganizationSummary(
        UUID organizationId,
        String name,
        String slug,
        Instant createdAt,
        SubscriptionPlan plan,
        SubscriptionStatus status,
        Integer seatLimit,
        Instant trialEndsAt,
        Instant currentPeriodEnd,
        int userCount,
        int evidenceCount,
        int integrationCount,
        int connectedIntegrationCount,
        int coveragePercent
) {
}
