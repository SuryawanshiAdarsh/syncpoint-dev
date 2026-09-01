package com.syncpoint.compliance.dashboard.controller;

import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.service.ComplianceService;
import com.syncpoint.compliance.dashboard.dto.ControlGap;
import com.syncpoint.compliance.dashboard.dto.DashboardSummary;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import com.syncpoint.compliance.integrations.repository.IntegrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final ComplianceService complianceService;
    private final EvidenceService evidenceService;
    private final EvidenceRepository evidenceRepo;
    private final IntegrationRepository integrationRepo;

    public DashboardController(ComplianceService complianceService,
                               EvidenceService evidenceService,
                               EvidenceRepository evidenceRepo,
                               IntegrationRepository integrationRepo) {
        this.complianceService = complianceService;
        this.evidenceService = evidenceService;
        this.evidenceRepo = evidenceRepo;
        this.integrationRepo = integrationRepo;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummary> summary() {
        UUID orgId = TenantContext.require().organizationId();
        List<ControlResponse> controls = complianceService.listAllControls();
        Map<ControlStatus, Integer> counts = new EnumMap<>(ControlStatus.class);
        for (ControlStatus s : ControlStatus.values()) counts.put(s, 0);
        for (ControlResponse c : controls) counts.merge(c.status(), 1, Integer::sum);
        int total = controls.size();
        int covered = counts.get(ControlStatus.COVERED);
        int partial = counts.get(ControlStatus.PARTIAL);
        int coverage = total == 0 ? 0 : (int) Math.round(100.0 * (covered + 0.5 * partial) / total);
        var integrations = integrationRepo.findByOrganizationIdOrderByCreatedAt(orgId);
        int connected = (int) integrations.stream()
                .filter(i -> i.getStatus() == IntegrationStatus.CONNECTED).count();
        return ResponseEntity.ok(new DashboardSummary(
                total, counts, coverage,
                (int) evidenceRepo.countByOrganizationId(orgId),
                integrations.size(), connected));
    }

    @GetMapping("/gaps")
    public ResponseEntity<List<ControlGap>> gaps() {
        return ResponseEntity.ok(complianceService.listAllControls().stream()
                .filter(c -> c.status() == ControlStatus.MISSING
                        || c.status() == ControlStatus.PARTIAL
                        || c.status() == ControlStatus.NEEDS_REVIEW)
                .map(c -> new ControlGap(c.id(), c.code(), c.title(), c.category(), c.status()))
                .toList());
    }

    @GetMapping("/recent-evidence")
    public ResponseEntity<List<EvidenceResponse>> recent() {
        List<EvidenceResponse> all = evidenceService.list();
        return ResponseEntity.ok(all.stream().limit(10).toList());
    }
}
