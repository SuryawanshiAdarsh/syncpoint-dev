package com.syncpoint.compliance.dashboard.dto;

import java.time.LocalDate;

public record CoverageTrendPoint(
        LocalDate date,
        int covered,
        int partial,
        int missing,
        int needsReview,
        int coveragePercent
) {
}
