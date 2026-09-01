package com.syncpoint.compliance.dashboard.dto;

import com.syncpoint.compliance.compliance.dto.ControlStatus;

import java.util.Map;

public record DashboardSummary(
        int totalControls,
        Map<ControlStatus, Integer> byStatus,
        int coveragePercent,
        int totalEvidence,
        int totalIntegrations,
        int connectedIntegrations
) {
}
