package com.syncpoint.compliance.organization.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * All kickoff-wizard fields saved together as one Settings section. {@code tscScopeExtra} holds
 * only the OPTIONAL categories (Security is always in scope and never sent here).
 */
public record UpdateComplianceProgramRequest(
        List<String> tscScopeExtra,
        String reportType,
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
