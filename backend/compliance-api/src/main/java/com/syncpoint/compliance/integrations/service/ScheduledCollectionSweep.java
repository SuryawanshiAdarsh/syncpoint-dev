package com.syncpoint.compliance.integrations.service;

import com.syncpoint.compliance.collection.entity.CollectionRunStatus;
import com.syncpoint.compliance.collection.repository.CollectionRunRepository;
import com.syncpoint.compliance.integrations.entity.Integration;
import com.syncpoint.compliance.integrations.entity.IntegrationSchedule;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import com.syncpoint.compliance.integrations.repository.IntegrationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Background job that makes {@code schedule = DAILY/WEEKLY} on an integration actually mean
 * something. Runs with no HTTP request and no logged-in user — every downstream call in this
 * class must be tenant-free (see {@link IntegrationService#triggerScheduledCollection}).
 */
@Component
public class ScheduledCollectionSweep {

    private static final Logger log = LoggerFactory.getLogger(ScheduledCollectionSweep.class);
    private static final Set<CollectionRunStatus> IN_FLIGHT =
            EnumSet.of(CollectionRunStatus.QUEUED, CollectionRunStatus.RUNNING);

    private final IntegrationRepository integrationRepo;
    private final CollectionRunRepository runs;
    private final IntegrationService integrationService;

    public ScheduledCollectionSweep(IntegrationRepository integrationRepo,
                                    CollectionRunRepository runs,
                                    IntegrationService integrationService) {
        this.integrationRepo = integrationRepo;
        this.runs = runs;
        this.integrationService = integrationService;
    }

    @Scheduled(cron = "${syncpoint.collection.sweep-cron:0 0 * * * *}")
    public void sweep() {
        List<Integration> candidates =
                integrationRepo.findByStatusAndScheduleNot(IntegrationStatus.CONNECTED, IntegrationSchedule.MANUAL);
        Instant now = Instant.now();
        int triggered = 0;

        for (Integration i : candidates) {
            try {
                if (!isDue(i, now)) continue;
                if (runs.existsByIntegrationIdAndStatusIn(i.getId(), IN_FLIGHT)) {
                    log.debug("skipping sweep for integration {} — a run is already in flight", i.getId());
                    continue;
                }
                integrationService.triggerScheduledCollection(i);
                triggered++;
            } catch (RuntimeException e) {
                // One integration's failure must never stop the sweep from reaching the rest.
                log.warn("scheduled collection failed to start for integration {}: {}", i.getId(), e.getMessage());
            }
        }

        if (triggered > 0) {
            log.info("scheduled collection sweep triggered {} of {} candidate integration(s)",
                    triggered, candidates.size());
        }
    }

    private boolean isDue(Integration i, Instant now) {
        Instant last = i.getLastCollectionAt();
        if (last == null) return true;
        Duration since = Duration.between(last, now);
        return switch (i.getSchedule()) {
            case DAILY -> since.compareTo(Duration.ofHours(24)) >= 0;
            case WEEKLY -> since.compareTo(Duration.ofDays(7)) >= 0;
            case MANUAL -> false;
        };
    }
}
