package com.syncpoint.compliance.auditor.dto;

import com.syncpoint.compliance.organization.entity.ReportType;

import java.time.LocalDate;

/** Auditor workspace landing page -- engagement context + coverage snapshot, no write access. */
public record AuditorOverviewResponse(
        String organizationName,
        String auditorFirmName,
        ReportType reportType,
        LocalDate observationPeriodStart,
        LocalDate observationPeriodEnd,
        LocalDate targetReportDate,
        int totalControls,
        int coveredCount,
        int coveragePercent,
        int openRequestCount
) {
}
