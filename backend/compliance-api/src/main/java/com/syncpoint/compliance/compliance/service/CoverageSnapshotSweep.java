package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.entity.ControlStatusSnapshot;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.compliance.repository.ControlStatusSnapshotRepository;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Snapshots every org's live-derived control status once a day so a coverage-trend chart has
 * real history to draw from. Runs with no HTTP request and no logged-in user, so every call in
 * here must be tenant-free (statusResolver takes an explicit organizationId, unlike
 * {@link ComplianceService}, which reads it off {@code TenantContext}).
 */
@Component
public class CoverageSnapshotSweep implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CoverageSnapshotSweep.class);

    private final OrganizationRepository organizations;
    private final ControlRepository controls;
    private final ControlStatusResolver statusResolver;
    private final ControlStatusSnapshotRepository snapshots;

    public CoverageSnapshotSweep(OrganizationRepository organizations,
                                 ControlRepository controls,
                                 ControlStatusResolver statusResolver,
                                 ControlStatusSnapshotRepository snapshots) {
        this.organizations = organizations;
        this.controls = controls;
        this.statusResolver = statusResolver;
        this.snapshots = snapshots;
    }

    /** Snapshot immediately at boot too, so a freshly started demo has at least today's real data point. */
    @Override
    public void run(ApplicationArguments args) {
        sweep();
    }

    @Scheduled(cron = "${syncpoint.coverage.snapshot-cron:0 30 0 * * *}")
    public void sweep() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<Control> activeControls = controls.findByActiveTrueOrderByCode();
        List<UUID> controlIds = activeControls.stream().map(Control::getId).toList();
        if (controlIds.isEmpty()) return;

        int snapshotted = 0;
        for (Organization org : organizations.findAll()) {
            try {
                if (snapshots.existsByOrganizationIdAndSnapshotDate(org.getId(), today)) continue;
                Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(org.getId(), controlIds);
                List<ControlStatusSnapshot> rows = controlIds.stream()
                        .map(id -> new ControlStatusSnapshot(
                                org.getId(), id, statuses.getOrDefault(id, ControlStatus.MISSING), today))
                        .toList();
                snapshots.saveAll(rows);
                snapshotted++;
            } catch (RuntimeException e) {
                // One org's failure must never stop the sweep from reaching the rest.
                log.warn("coverage snapshot failed for org {}: {}", org.getId(), e.getMessage());
            }
        }

        if (snapshotted > 0) {
            log.info("coverage snapshot sweep recorded {} org(s) for {}", snapshotted, today);
        }
    }
}
