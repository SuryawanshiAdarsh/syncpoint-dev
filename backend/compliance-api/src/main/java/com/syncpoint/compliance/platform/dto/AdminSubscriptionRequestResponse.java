package com.syncpoint.compliance.platform.dto;

import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionRequestStatus;

import java.time.Instant;
import java.util.UUID;

/** Admin-facing view of a subscription request, enriched with org + requester identity. */
public record AdminSubscriptionRequestResponse(
        UUID id,
        UUID organizationId,
        String organizationName,
        String organizationSlug,
        SubscriptionPlan currentPlan,
        Integer currentSeatLimit,
        String requestedByName,
        String requestedByEmail,
        SubscriptionPlan requestedPlan,
        Integer requestedSeatLimit,
        String note,
        SubscriptionRequestStatus status,
        String reviewNote,
        Instant createdAt,
        Instant reviewedAt
) {
}
