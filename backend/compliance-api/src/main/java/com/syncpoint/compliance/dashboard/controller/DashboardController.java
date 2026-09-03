package com.syncpoint.compliance.dashboard.controller;

import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.repository.ControlStatusSnapshotRepository;
import com.syncpoint.compliance.compliance.service.ComplianceService;
import com.syncpoint.compliance.dashboard.dto.ControlGap;
import com.syncpoint.compliance.dashboard.dto.CoverageTrendPoint;
import com.syncpoint.compliance.dashboard.dto.DashboardSummary;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import com.syncpoint.compliance.integrations.repository.IntegrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final ComplianceService complianceService;
    private final EvidenceService evidenceService;
    private final EvidenceRepository evidenceRepo;
    private final IntegrationRepository integrationRepo;
    private final ControlStatusSnapshotRepository snapshotRepo;

    public DashboardController(ComplianceService complianceService,
                               EvidenceService evidenceService,
                               EvidenceRepository evidenceRepo,
                               IntegrationRepository integrationRepo,
                               ControlStatusSnapshotRepository snapshotRepo) {
        this.complianceService = complianceService;
        this.evidenceService = evidenceService;
        this.evidenceRepo = evidenceRepo;
        this.integrationRepo = integrationRepo;
        this.snapshotRepo = snapshotRepo;
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

    @GetMapping("/coverage-trend")
    public ResponseEntity<List<CoverageTrendPoint>> coverageTrend(
            @RequestParam(defaultValue = "30") int days) {
        UUID orgId = TenantContext.require().organizationId();
        LocalDate since = LocalDate.now(ZoneOffset.UTC).minusDays(Math.max(1, days) - 1L);
        Map<LocalDate, Map<ControlStatus, Integer>> byDate = new TreeMap<>();
        for (var tally : snapshotRepo.tallyByOrganizationIdSince(orgId, since)) {
            byDate.computeIfAbsent(tally.getSnapshotDate(), d -> new EnumMap<>(ControlStatus.class))
                    .merge(tally.getStatus(), (int) tally.getTotal(), Integer::sum);
        }
        List<CoverageTrendPoint> points = byDate.entrySet().stream()
                .map(e -> toTrendPoint(e.getKey(), e.getValue()))
                .toList();
        return ResponseEntity.ok(points);
    }

    private CoverageTrendPoint toTrendPoint(LocalDate date, Map<ControlStatus, Integer> counts) {
        int covered = counts.getOrDefault(ControlStatus.COVERED, 0);
        int partial = counts.getOrDefault(ControlStatus.PARTIAL, 0);
        int missing = counts.getOrDefault(ControlStatus.MISSING, 0);
        int needsReview = counts.getOrDefault(ControlStatus.NEEDS_REVIEW, 0);
        int total = covered + partial + missing + needsReview;
        int coveragePercent = total == 0 ? 0 : (int) Math.round(100.0 * (covered + 0.5 * partial) / total);
        return new CoverageTrendPoint(date, covered, partial, missing, needsReview, coveragePercent);
    }
}
