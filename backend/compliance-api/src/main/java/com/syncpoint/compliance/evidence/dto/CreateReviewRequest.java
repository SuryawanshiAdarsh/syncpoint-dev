package com.syncpoint.compliance.evidence.dto;

import com.syncpoint.compliance.evidence.entity.ReviewDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull ReviewDecision decision,
        @Size(max = 4000) String comments
) {
}
