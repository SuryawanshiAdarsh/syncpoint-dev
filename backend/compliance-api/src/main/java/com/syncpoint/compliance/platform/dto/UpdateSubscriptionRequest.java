package com.syncpoint.compliance.platform.dto;

import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record UpdateSubscriptionRequest(
        @NotNull SubscriptionPlan plan,
        @NotNull SubscriptionStatus status,
        @Min(1) Integer seatLimit,
        Instant trialEndsAt,
        Instant currentPeriodEnd
) {
}
