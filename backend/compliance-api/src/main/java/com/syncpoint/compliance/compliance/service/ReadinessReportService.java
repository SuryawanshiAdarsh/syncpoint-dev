package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.auditor.entity.AuditorControlReview;
import com.syncpoint.compliance.auditor.repository.AuditorControlReviewRepository;
import com.syncpoint.compliance.compliance.dto.ControlExceptionResponse;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import com.syncpoint.compliance.risk.entity.Risk;
import com.syncpoint.compliance.risk.entity.RiskControlLink;
import com.syncpoint.compliance.risk.entity.RiskStatus;
import com.syncpoint.compliance.risk.repository.RiskControlLinkRepository;
import com.syncpoint.compliance.risk.repository.RiskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The single artifact a customer hands their CPA firm to start SOC 2 scoping: program details,
 * system description, risk assessment, and a plain-language breakdown of what's covered vs. what's
 * still a gap -- plus, for Type II, whether evidence was actually sampled across the whole period.
 */
@Service
@Transactional(readOnly = true)
public class ReadinessReportService {

    private final ComplianceService complianceService;
    private final OrganizationRepository organizations;
    private final RiskRepository risks;
    private final RiskControlLinkRepository riskControlLinks;
    private final EvidenceControlMappingRepository evidenceControlMappings;
    private final EvidenceRepository evidenceRepository;
    private final ControlExceptionService controlExceptionService;
    private final AuditorControlReviewRepository auditorControlReviews;

    public ReadinessReportService(ComplianceService complianceService, OrganizationRepository organizations,
                                   RiskRepository risks, RiskControlLinkRepository riskControlLinks,
                                   EvidenceControlMappingRepository evidenceControlMappings,
                                   EvidenceRepository evidenceRepository,
                                   ControlExceptionService controlExceptionService,
                                   AuditorControlReviewRepository auditorControlReviews) {
        this.complianceService = complianceService;
        this.organizations = organizations;
        this.risks = risks;
        this.riskControlLinks = riskControlLinks;
        this.evidenceControlMappings = evidenceControlMappings;
        this.evidenceRepository = evidenceRepository;
        this.controlExceptionService = controlExceptionService;
        this.auditorControlReviews = auditorControlReviews;
    }

    public byte[] generate() {
        UUID orgId = TenantContext.require().organizationId();
        Organization org = organizations.findById(orgId).orElseThrow(() -> new NotFoundException("Organization not found"));
        List<ControlResponse> controls = complianceService.listAllControls();

        long covered = controls.stream().filter(c -> c.status().name().equals("COVERED")).count();
        long partial = controls.stream().filter(c -> c.status().name().equals("PARTIAL")).count();
        long needsReview = controls.stream().filter(c -> c.status().name().equals("NEEDS_REVIEW")).count();
        long missing = controls.stream().filter(c -> c.status().name().equals("MISSING")).count();
        int total = controls.size();
        int readinessPct = total == 0 ? 0 : Math.round((covered * 100f) / total);
        boolean isTypeII = org.getReportType() != null && "TYPE_II".equals(org.getReportType().name());

        StringBuilder sb = new StringBuilder();
        sb.append("SOC 2 READINESS / GAP REPORT\n");
        sb.append("=============================\n");
        sb.append("Organization: ").append(org.getName()).append('\n');
        sb.append("Generated:    ").append(Instant.now()).append("\n\n");

        sb.append("COMPLIANCE PROGRAM\n");
        sb.append("------------------\n");
        sb.append("Report type: ").append(org.getReportType() == null ? "Type I" : reportTypeLabel(org.getReportType().name())).append('\n');
        if (isTypeII) {
            sb.append("Observation period: ").append(str(org.getObservationPeriodStart())).append(" to ")
                    .append(str(org.getObservationPeriodEnd())).append('\n');
        }
        sb.append("Target report date: ").append(str(org.getTargetReportDate())).append('\n');
        sb.append("Trust Services Category scope: SECURITY")
                .append(org.getTscScopeExtra() == null || org.getTscScopeExtra().isBlank() ? "" : ", " + org.getTscScopeExtra().replace(",", ", "))
                .append("\n\n");

        sb.append("SYSTEM DESCRIPTION\n");
        sb.append("------------------\n");
        sb.append("Services provided:\n").append(blank(org.getServicesProvided())).append("\n\n");
        sb.append("System boundaries:\n").append(blank(org.getSystemBoundaries())).append("\n\n");
        sb.append("Components:\n").append(blank(org.getComponentsDescription())).append("\n\n");
        sb.append("Subservice organizations:\n").append(blank(org.getSubserviceOrganizations())).append("\n\n");
        sb.append("Complementary user-entity controls:\n").append(blank(org.getComplementaryUserEntityControls())).append("\n\n");
        if (isTypeII) {
            sb.append("Significant changes during the period:\n").append(blank(org.getSignificantChangesDuringPeriod())).append("\n\n");
        }

        sb.append("COVERAGE SUMMARY\n");
        sb.append("----------------\n");
        sb.append("Total controls in scope: ").append(total).append('\n');
        sb.append("Covered:      ").append(covered).append('\n');
        sb.append("Partial:      ").append(partial).append('\n');
        sb.append("Needs review: ").append(needsReview).append('\n');
        sb.append("Missing:      ").append(missing).append('\n');
        sb.append("Overall readiness: ").append(readinessPct).append("%\n\n");

        appendRiskAssessmentSummary(sb, orgId);

        if (isTypeII && org.getObservationPeriodStart() != null && org.getObservationPeriodEnd() != null) {
            appendObservationPeriodCoverage(sb, orgId, controls, org.getObservationPeriodStart(), org.getObservationPeriodEnd());
            appendExceptions(sb, org.getObservationPeriodStart(), org.getObservationPeriodEnd());
            appendAuditorActivity(sb, orgId, org.getObservationPeriodStart(), org.getObservationPeriodEnd());
        }

        sb.append("GAPS REQUIRING ATTENTION (Missing + Needs Review)\n");
        sb.append("--------------------------------------------------\n");
        List<ControlResponse> gaps = controls.stream()
                .filter(c -> c.status().name().equals("MISSING") || c.status().name().equals("NEEDS_REVIEW"))
                .sorted(Comparator.comparing(ControlResponse::code))
                .toList();
        if (gaps.isEmpty()) {
            sb.append("(none \u2014 every in-scope control has at least one confirmed, covering mapping)\n\n");
        } else {
            for (ControlResponse c : gaps) {
                sb.append("[").append(c.status()).append("] ").append(c.code()).append(" \u2014 ").append(c.title())
                        .append(" \u2014 Owner: ").append(c.ownerName() == null ? "Unassigned" : c.ownerName()).append('\n');
            }
            sb.append('\n');
        }

        sb.append("FULL CONTROL LIST\n");
        sb.append("-----------------\n");
        for (ControlResponse c : controls.stream().sorted(Comparator.comparing(ControlResponse::code)).toList()) {
            sb.append("[").append(c.status()).append("] ").append(c.code()).append(" \u2014 ").append(c.title())
                    .append(" (").append(c.category()).append(") \u2014 Owner: ")
                    .append(c.ownerName() == null ? "Unassigned" : c.ownerName()).append('\n');
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /** CC3-series risk assessment: totals by status, and the auditor's favorite question -- which risks have no mitigating control. */
    private void appendRiskAssessmentSummary(StringBuilder sb, UUID orgId) {
        List<Risk> riskList = risks.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        Map<UUID, List<RiskControlLink>> linksByRisk = riskControlLinks.findByOrganizationId(orgId).stream()
                .collect(Collectors.groupingBy(RiskControlLink::getRiskId));

        sb.append("RISK ASSESSMENT SUMMARY\n");
        sb.append("------------------------\n");
        sb.append("Total risks identified: ").append(riskList.size()).append('\n');
        for (RiskStatus status : RiskStatus.values()) {
            long count = riskList.stream().filter(r -> r.getStatus() == status).count();
            sb.append("  ").append(pad(status.name(), 12)).append(count).append('\n');
        }
        long highSeverityOpen = riskList.stream()
                .filter(r -> r.score() >= 6 && r.getStatus() != RiskStatus.MITIGATED && r.getStatus() != RiskStatus.ACCEPTED)
                .count();
        sb.append("High-severity risks (score >= 6) not yet mitigated or accepted: ").append(highSeverityOpen).append('\n');

        List<Risk> unlinked = riskList.stream()
                .filter(r -> linksByRisk.getOrDefault(r.getId(), List.of()).isEmpty())
                .sorted(Comparator.comparing(Risk::getTitle))
                .toList();
        sb.append("Risks with no mitigating control linked (auditor gap): ").append(unlinked.size()).append('\n');
        for (Risk r : unlinked) {
            sb.append("  - ").append(r.getTitle()).append(" (").append(r.getCategory()).append(", score ").append(r.score()).append(")\n");
        }
        if (riskList.isEmpty()) {
            sb.append("  (no risks recorded yet \u2014 a documented risk assessment is required for every SOC 2 report)\n");
        }
        sb.append('\n');
    }

    /**
     * Type II requires proof controls operated effectively across the WHOLE observation window, not
     * just at a point in time. Buckets the period into calendar months and checks, per control, how
     * many months have at least one piece of collected evidence backing it.
     */
    private void appendObservationPeriodCoverage(StringBuilder sb, UUID orgId, List<ControlResponse> controls,
                                                  LocalDate start, LocalDate end) {
        List<YearMonth> periods = new ArrayList<>();
        for (YearMonth m = YearMonth.from(start); !m.isAfter(YearMonth.from(end)); m = m.plusMonths(1)) {
            periods.add(m);
        }

        Map<UUID, Instant> collectedAtByEvidenceId = evidenceRepository.findByOrganizationIdOrderByCollectedAtDesc(orgId).stream()
                .collect(Collectors.toMap(Evidence::getId, Evidence::getCollectedAt, (a, b) -> a));
        Map<UUID, List<EvidenceControlMapping>> mappingsByControl = evidenceControlMappings.findByOrganizationId(orgId).stream()
                .collect(Collectors.groupingBy(EvidenceControlMapping::getControlId));

        sb.append("TYPE II OBSERVATION PERIOD COVERAGE (").append(start).append(" to ").append(end)
                .append(", ").append(periods.size()).append(periods.size() == 1 ? " monthly period)\n" : " monthly periods)\n");
        sb.append("--------------------------------------------------------------------\n");
        sb.append("Auditors require evidence sampled throughout the entire period, not just a single snapshot.\n\n");

        int sufficientCount = 0;
        List<String> lines = new ArrayList<>();
        for (ControlResponse c : controls.stream().sorted(Comparator.comparing(ControlResponse::code)).toList()) {
            Set<YearMonth> coveredMonths = new HashSet<>();
            for (EvidenceControlMapping m : mappingsByControl.getOrDefault(c.id(), List.of())) {
                Instant collectedAt = collectedAtByEvidenceId.get(m.getEvidenceId());
                if (collectedAt == null) continue;
                YearMonth ym = YearMonth.from(collectedAt.atZone(ZoneOffset.UTC).toLocalDate());
                if (!ym.isBefore(YearMonth.from(start)) && !ym.isAfter(YearMonth.from(end))) {
                    coveredMonths.add(ym);
                }
            }
            boolean sufficient = !periods.isEmpty() && coveredMonths.size() >= periods.size();
            if (sufficient) sufficientCount++;
            lines.add("[" + (sufficient ? "SUFFICIENT" : "INSUFFICIENT") + "] " + c.code() + " \u2014 " + c.title()
                    + " \u2014 " + coveredMonths.size() + " of " + periods.size() + " periods have evidence");
        }
        lines.forEach(l -> sb.append(l).append('\n'));
        sb.append('\n');
        sb.append("Summary: ").append(sufficientCount).append(" of ").append(controls.size())
                .append(" controls have evidence sampled across every period in the observation window.\n\n");
    }

    /** Distinct from evidence-coverage above: proof a control failed partway through the period and was remediated. */
    private void appendExceptions(StringBuilder sb, LocalDate start, LocalDate end) {
        List<ControlExceptionResponse> all = controlExceptionService.listForOrganization().stream()
                .filter(e -> !e.detectedDate().isBefore(start) && !e.detectedDate().isAfter(end))
                .sorted(Comparator.comparing(ControlExceptionResponse::detectedDate))
                .toList();

        sb.append("EXCEPTIONS DURING THE OBSERVATION PERIOD\n");
        sb.append("-----------------------------------------\n");
        long open = all.stream().filter(e -> e.status().name().equals("OPEN")).count();
        sb.append("Total exceptions logged: ").append(all.size()).append('\n');
        sb.append("Still open (not yet remediated): ").append(open).append("\n\n");
        if (all.isEmpty()) {
            sb.append("(none logged for this period)\n\n");
        } else {
            for (ControlExceptionResponse e : all) {
                sb.append("[").append(e.status()).append("] ").append(e.controlCode()).append(" \u2014 detected ")
                        .append(e.detectedDate()).append(": ").append(e.description());
                if (e.remediatedDate() != null) {
                    sb.append(" (remediated ").append(e.remediatedDate()).append(")");
                }
                sb.append('\n');
            }
            sb.append('\n');
        }
    }

    /** Proof the invited auditor actually looked at controls during the engagement -- distinct
     *  from exceptions/coverage, this is the auditor's OWN record of having tested something. */
    private void appendAuditorActivity(StringBuilder sb, UUID orgId, LocalDate start, LocalDate end) {
        List<AuditorControlReview> all = auditorControlReviews.findByOrganizationIdOrderByReviewedAtDesc(orgId).stream()
                .filter(r -> {
                    LocalDate d = r.getReviewedAt().atZone(ZoneOffset.UTC).toLocalDate();
                    return !d.isBefore(start) && !d.isAfter(end);
                })
                .toList();

        sb.append("AUDITOR ACTIVITY DURING THE OBSERVATION PERIOD\n");
        sb.append("------------------------------------------------\n");
        sb.append("Controls marked reviewed/tested by the auditor: ").append(all.size()).append('\n');
        if (all.isEmpty()) {
            sb.append("(no auditor review activity recorded for this period)\n\n");
        } else {
            Map<UUID, String> codesById = complianceService.listAllControls().stream()
                    .collect(Collectors.toMap(ControlResponse::id, ControlResponse::code, (a, b) -> a));
            for (AuditorControlReview r : all) {
                sb.append("  - ").append(codesById.getOrDefault(r.getControlId(), "(control)"))
                        .append(" \u2014 reviewed ").append(r.getReviewedAt());
                if (r.getNote() != null && !r.getNote().isBlank()) {
                    sb.append(": ").append(r.getNote());
                }
                sb.append('\n');
            }
            sb.append('\n');
        }
    }

    private static String pad(String s, int width) {
        StringBuilder b = new StringBuilder(s).append(":");
        while (b.length() < width) b.append(' ');
        return b.toString();
    }

    private static String str(Object o) {
        return o == null ? "(not set)" : o.toString();
    }

    private static String blank(String s) {
        return (s == null || s.isBlank()) ? "(not yet documented)" : s;
    }

    private static String reportTypeLabel(String s) {
        return "TYPE_II".equals(s) ? "Type II \u2014 operating effectiveness over a period" : "Type I \u2014 point-in-time design";
    }
}

