package com.syncpoint.compliance.policy.dto;

import java.time.LocalDate;
import java.util.UUID;

public record UpdatePolicyRequest(
        UUID ownerUserId,
        String category,
        String description,
        LocalDate nextReviewDate
) {
}
