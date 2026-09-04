package com.syncpoint.compliance.platform.dto;

import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;

import java.time.Instant;

/** Tenant-facing view of an org's own subscription (Settings > Billing). */
public record SubscriptionResponse(
        SubscriptionPlan plan,
        SubscriptionStatus status,
        Integer seatLimit,
        Instant trialEndsAt,
        Instant currentPeriodStart,
        Instant currentPeriodEnd,
        boolean canRequestChange
) {
}
