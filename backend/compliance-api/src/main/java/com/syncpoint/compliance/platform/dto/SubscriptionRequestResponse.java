package com.syncpoint.compliance.platform.dto;

import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionRequestStatus;

import java.time.Instant;
import java.util.UUID;

/** Tenant-facing view of one of the org's own subscription requests. */
public record SubscriptionRequestResponse(
        UUID id,
        SubscriptionPlan requestedPlan,
        Integer requestedSeatLimit,
        String note,
        SubscriptionRequestStatus status,
        String reviewNote,
        Instant createdAt,
        Instant reviewedAt
) {
}
