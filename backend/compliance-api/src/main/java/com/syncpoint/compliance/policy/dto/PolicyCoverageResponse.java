package com.syncpoint.compliance.policy.dto;

import java.util.List;

public record PolicyCoverageResponse(
        int totalControls,
        int coveredCount,
        List<String> coveredControlCodes,
        List<String> uncoveredControlCodes
) {
}
