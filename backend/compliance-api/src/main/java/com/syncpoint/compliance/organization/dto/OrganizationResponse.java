package com.syncpoint.compliance.organization.dto;

import com.syncpoint.compliance.organization.entity.ReportType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record OrganizationResponse(
        UUID id,
        String name,
        String slug,
        Instant createdAt,
        boolean onboardingCompleted,
        Instant onboardingCompletedAt,
        List<String> tscScope,
        ReportType reportType,
        LocalDate observationPeriodStart,
        LocalDate observationPeriodEnd,
        LocalDate targetReportDate,
        String servicesProvided,
        String systemBoundaries,
        String componentsDescription,
        String subserviceOrganizations,
        String complementaryUserEntityControls,
        String significantChangesDuringPeriod
) {
}
