package com.syncpoint.compliance.integrations.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.collection.entity.CollectionItem;
import com.syncpoint.compliance.collection.entity.CollectionItemStatus;
import com.syncpoint.compliance.collection.entity.CollectionRun;
import com.syncpoint.compliance.collection.entity.CollectionRunStatus;
import com.syncpoint.compliance.collection.repository.CollectionItemRepository;
import com.syncpoint.compliance.collection.repository.CollectionRunRepository;
import com.syncpoint.compliance.common.secret.SecretStore;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceSourceType;
import com.syncpoint.compliance.evidence.entity.EvidenceStatus;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceVersionRepository;
import com.syncpoint.compliance.integrations.connector.CollectedItem;
import com.syncpoint.compliance.integrations.connector.CollectionContext;
import com.syncpoint.compliance.integrations.connector.CollectorRegistry;
import com.syncpoint.compliance.integrations.connector.EvidenceCollector;
import com.syncpoint.compliance.integrations.entity.Integration;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import com.syncpoint.compliance.integrations.repository.IntegrationRepository;
import com.syncpoint.compliance.storage.ObjectStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Runs a collection off the request thread and persists the resulting evidence. */
@Service
public class CollectionRunner {

    private static final Logger log = LoggerFactory.getLogger(CollectionRunner.class);

    private final IntegrationRepository integrationRepo;
    private final CollectionRunRepository runs;
    private final CollectionItemRepository items;
    private final EvidenceRepository evidenceRepo;
    private final EvidenceVersionRepository versionRepo;
    private final SecretStore secretStore;
    private final CollectorRegistry collectors;
    private final ObjectStorageService storage;
    private final AuditService audit;

    public CollectionRunner(IntegrationRepository integrationRepo,
                            CollectionRunRepository runs,
                            CollectionItemRepository items,
                            EvidenceRepository evidenceRepo,
                            EvidenceVersionRepository versionRepo,
                            SecretStore secretStore,
                            CollectorRegistry collectors,
                            ObjectStorageService storage,
                            AuditService audit) {
        this.integrationRepo = integrationRepo;
        this.runs = runs;
        this.items = items;
        this.evidenceRepo = evidenceRepo;
        this.versionRepo = versionRepo;
        this.secretStore = secretStore;
        this.collectors = collectors;
        this.storage = storage;
        this.audit = audit;
    }

    @Async("collectionExecutor")
    public void run(UUID runId, UUID integrationId) {
        try {
            executeRun(runId, integrationId);
        } catch (RuntimeException e) {
            log.error("collection run {} failed", runId, e);
            markFailed(runId, e.getMessage());
        }
    }

    protected void executeRun(UUID runId, UUID integrationId) {
        CollectionRun run = runs.findById(runId).orElseThrow();
        Integration integration = integrationRepo.findById(integrationId).orElseThrow();
        run.setStatus(CollectionRunStatus.RUNNING);
        run.setStartedAt(Instant.now());
        runs.save(run);

        int ok = 0;
        int failed = 0;
        try {
            EvidenceCollector collector = collectors.require(integration.getProvider());
            byte[] cred = integration.getCredentialReference() == null
                    ? new byte[0]
                    : secretStore.read(integration.getCredentialReference());
            CollectionContext ctx = new CollectionContext(
                    integration.getOrganizationId(), integration.getId(),
                    cred, integration.getConfiguration(),
                    integration.getProvider().name().toLowerCase() + "/1");

            List<CollectedItem> collected = collector.collect(ctx);

            for (CollectedItem c : collected) {
                try {
                    UUID evidenceId = persistItem(integration, c);
                    items.save(new CollectionItem(integration.getOrganizationId(), run.getId(),
                            c.evidenceType(), CollectionItemStatus.SUCCESS, null, evidenceId));
                    ok++;
                } catch (RuntimeException itemEx) {
                    log.warn("collection item {} failed: {}", c.evidenceType(), itemEx.getMessage());
                    items.save(new CollectionItem(integration.getOrganizationId(), run.getId(),
                            c.evidenceType(), CollectionItemStatus.FAILED, itemEx.getMessage(), null));
                    failed++;
                }
            }

            run.setCompletedAt(Instant.now());
            if (failed == 0) run.setStatus(CollectionRunStatus.COMPLETED);
            else if (ok > 0) run.setStatus(CollectionRunStatus.PARTIAL);
            else run.setStatus(CollectionRunStatus.FAILED);
            runs.save(run);

            integration.setLastCollectionAt(Instant.now());
            integration.setStatus(IntegrationStatus.CONNECTED);
            integrationRepo.save(integration);

            audit.record(integration.getOrganizationId(), run.getTriggeredBy(),
                    AuditEvents.COLLECTION_COMPLETED, "collection_run", run.getId(),
                    Map.of("provider", integration.getProvider().name(), "ok", ok, "failed", failed,
                            "status", run.getStatus().name()));
        } catch (RuntimeException e) {
            log.error("collection run failed", e);
            run.setCompletedAt(Instant.now());
            run.setStatus(CollectionRunStatus.FAILED);
            run.setErrorMessage(safeShort(e.getMessage()));
            runs.save(run);
            integration.setStatus(IntegrationStatus.ERROR);
            integration.setLastTestMessage(safeShort(e.getMessage()));
            integrationRepo.save(integration);
            audit.record(integration.getOrganizationId(), run.getTriggeredBy(),
                    AuditEvents.COLLECTION_FAILED, "collection_run", run.getId(),
                    Map.of("error", safeShort(e.getMessage())));
        }
    }

    private UUID persistItem(Integration integration, CollectedItem c) {
        Instant now = Instant.now();
        UUID orgId = integration.getOrganizationId();
        String source = integration.getProvider().name().toLowerCase();
        String hash = sha256Hex(c.payload());

        Evidence evidence = evidenceRepo.save(new Evidence(
                orgId, c.displayName(), c.description(),
                EvidenceSourceType.valueOf(sourceEnum(integration.getProvider().name())),
                source, EvidenceStatus.COLLECTED, now,
                now.plus(90, ChronoUnit.DAYS), integration.getCreatedBy()));

        String key = storage.buildKey(orgId, evidence.getId(), UUID.randomUUID());
        storage.put(key, c.payload(), c.mimeType());

        EvidenceVersion version = versionRepo.save(new EvidenceVersion(
                evidence.getId(), orgId, 1, key, hash,
                c.payload().length, c.mimeType(),
                integration.getProvider().name().toLowerCase() + "/1", now));

        audit.record(orgId, integration.getCreatedBy(),
                AuditEvents.EVIDENCE_CREATED, "evidence", evidence.getId(),
                Map.of("source", integration.getProvider().name(),
                       "evidenceType", c.evidenceType(),
                       "sizeBytes", c.payload().length,
                       "contentHash", hash));
        return evidence.getId();
    }

    @Transactional
    protected void markFailed(UUID runId, String message) {        runs.findById(runId).ifPresent(run -> {
            run.setStatus(CollectionRunStatus.FAILED);
            run.setCompletedAt(Instant.now());
            run.setErrorMessage(safeShort(message));
            runs.save(run);
        });
    }

    private static String sourceEnum(String providerName) {
        // integration providers align 1:1 with evidence source types.
        return providerName;
    }

    private static String sha256Hex(byte[] data) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String safeShort(String s) {
        if (s == null) return "";
        return s.length() > 500 ? s.substring(0, 500) : s;
    }
}
