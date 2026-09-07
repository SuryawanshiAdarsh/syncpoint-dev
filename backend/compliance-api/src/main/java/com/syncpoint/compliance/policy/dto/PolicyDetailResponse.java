package com.syncpoint.compliance.policy.dto;

import java.util.List;

public record PolicyDetailResponse(
        PolicyResponse policy,
        List<PolicyAcknowledgmentResponse> roster
) {
}
