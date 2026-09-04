package com.syncpoint.compliance.platform.dto;

import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSubscriptionRequestRequest(
        @NotNull SubscriptionPlan requestedPlan,
        @NotNull @Min(1) Integer requestedSeatLimit,
        @Size(max = 500) String note
) {
}
