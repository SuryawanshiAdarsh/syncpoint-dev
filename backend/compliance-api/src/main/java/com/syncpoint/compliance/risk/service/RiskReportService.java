package com.syncpoint.compliance.risk.service;

import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
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
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The standalone risk-assessment artifact -- previously this data was only ever surfaced as a
 * summary section inside the Readiness Report; some auditors want the risk register as its own
 * document. Shares no logic with ReadinessReportService's summary (which stays as-is for the
 * combined report); this is the full per-risk detail listing.
 */
@Service
@Transactional(readOnly = true)
public class RiskReportService {

    private final RiskRepository risks;
    private final RiskControlLinkRepository riskControlLinks;
    private final ControlRepository controls;
    private final UserRepository users;
    private final OrganizationRepository organizations;

    public RiskReportService(RiskRepository risks, RiskControlLinkRepository riskControlLinks,
                             ControlRepository controls, UserRepository users,
                             OrganizationRepository organizations) {
        this.risks = risks;
        this.riskControlLinks = riskControlLinks;
        this.controls = controls;
        this.users = users;
        this.organizations = organizations;
    }

    public byte[] generate() {
        UUID orgId = TenantContext.require().organizationId();
        Organization org = organizations.findById(orgId).orElseThrow(() -> new NotFoundException("Organization not found"));

        List<Risk> riskList = risks.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        Map<UUID, List<RiskControlLink>> linksByRisk = riskControlLinks.findByOrganizationId(orgId).stream()
                .collect(Collectors.groupingBy(RiskControlLink::getRiskId));
        Map<UUID, Control> controlsById = controls.findAllById(
                linksByRisk.values().stream().flatMap(List::stream).map(RiskControlLink::getControlId).distinct().toList()
        ).stream().collect(Collectors.toMap(Control::getId, c -> c));
        Map<UUID, User> ownersById = users.findAllById(
                riskList.stream().map(Risk::getOwnerUserId).filter(java.util.Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(User::getId, u -> u));

        StringBuilder sb = new StringBuilder();
        sb.append("SOC 2 RISK ASSESSMENT\n");
        sb.append("=====================\n");
        sb.append("Organization: ").append(org.getName()).append('\n');
        sb.append("Generated:    ").append(Instant.now()).append("\n\n");

        sb.append("SUMMARY\n");
        sb.append("-------\n");
        sb.append("Total risks identified: ").append(riskList.size()).append('\n');
        for (RiskStatus status : RiskStatus.values()) {
            long count = riskList.stream().filter(r -> r.getStatus() == status).count();
            sb.append("  ").append(pad(status.name(), 14)).append(count).append('\n');
        }
        long highSeverityOpen = riskList.stream()
                .filter(r -> r.score() >= 6 && r.getStatus() != RiskStatus.MITIGATED && r.getStatus() != RiskStatus.ACCEPTED)
                .count();
        sb.append("High-severity risks (score >= 6) not yet mitigated or accepted: ").append(highSeverityOpen).append("\n\n");

        sb.append("RISK REGISTER DETAIL\n");
        sb.append("---------------------\n");
        if (riskList.isEmpty()) {
            sb.append("(no risks recorded yet \u2014 a documented risk assessment is required for every SOC 2 report)\n");
        } else {
            for (Risk r : riskList.stream().sorted(Comparator.comparingInt(Risk::score).reversed()).toList()) {
                User owner = r.getOwnerUserId() == null ? null : ownersById.get(r.getOwnerUserId());
                List<RiskControlLink> links = linksByRisk.getOrDefault(r.getId(), List.of());
                String linkedCodes = links.isEmpty() ? "(none \u2014 auditor gap)" : links.stream()
                        .map(l -> controlsById.get(l.getControlId()))
                        .filter(java.util.Objects::nonNull)
                        .map(Control::getCode)
                        .sorted()
                        .collect(Collectors.joining(", "));

                sb.append(r.getTitle()).append('\n');
                sb.append("  Category:          ").append(r.getCategory()).append('\n');
                sb.append("  Likelihood/Impact:  ").append(r.getLikelihood()).append(" / ").append(r.getImpact())
                        .append(" (score ").append(r.score()).append(")\n");
                sb.append("  Status:            ").append(r.getStatus()).append('\n');
                sb.append("  Owner:             ").append(owner == null ? "Unassigned" : owner.getName()).append('\n');
                sb.append("  Next review date:  ").append(r.getNextReviewDate() == null ? "(not set)" : r.getNextReviewDate()).append('\n');
                sb.append("  Linked controls:   ").append(linkedCodes).append('\n');
                if (r.getDescription() != null && !r.getDescription().isBlank()) {
                    sb.append("  Description:       ").append(r.getDescription()).append('\n');
                }
                sb.append('\n');
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String pad(String s, int width) {
        StringBuilder b = new StringBuilder(s).append(":");
        while (b.length() < width) b.append(' ');
        return b.toString();
    }
}
