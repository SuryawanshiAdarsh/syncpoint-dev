package com.syncpoint.compliance.integrations.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.collection.entity.CollectionRun;
import com.syncpoint.compliance.collection.repository.CollectionRunRepository;
import com.syncpoint.compliance.common.exception.ApiException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.secret.SecretStore;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.integrations.connector.CollectorRegistry;
import com.syncpoint.compliance.integrations.connector.EvidenceCollector;
import com.syncpoint.compliance.integrations.connector.TestContext;
import com.syncpoint.compliance.integrations.connector.TestResult;
import com.syncpoint.compliance.integrations.dto.GitHubIntegrationRequest;
import com.syncpoint.compliance.integrations.dto.IntegrationResponse;
import com.syncpoint.compliance.integrations.dto.TestConnectionResponse;
import com.syncpoint.compliance.integrations.entity.Integration;
import com.syncpoint.compliance.integrations.entity.IntegrationProvider;
import com.syncpoint.compliance.integrations.entity.IntegrationSchedule;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import com.syncpoint.compliance.integrations.repository.IntegrationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class IntegrationService {

    private final IntegrationRepository integrationRepo;
    private final SecretStore secretStore;
    private final CollectorRegistry collectorRegistry;
    private final CollectionRunRepository runs;
    private final AuditService audit;
    private final CollectionRunner collectionRunner;

    public IntegrationService(IntegrationRepository integrationRepo,
                              SecretStore secretStore,
                              CollectorRegistry collectorRegistry,
                              CollectionRunRepository runs,
                              AuditService audit,
                              CollectionRunner collectionRunner) {
        this.integrationRepo = integrationRepo;
        this.secretStore = secretStore;
        this.collectorRegistry = collectorRegistry;
        this.runs = runs;
        this.audit = audit;
        this.collectionRunner = collectionRunner;
    }

    @Transactional(readOnly = true)
    public List<IntegrationResponse> list() {
        UUID orgId = TenantContext.require().organizationId();
        return integrationRepo.findByOrganizationIdOrderByCreatedAt(orgId).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public IntegrationResponse get(UUID id) {
        return toResponse(requireOwned(id));
    }

    @Transactional
    public IntegrationResponse connectGithub(GitHubIntegrationRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        UUID actor = TenantContext.require().userId();
        // Delete any prior github integration for this org (only one allowed per provider for MVP).
        integrationRepo.findByOrganizationIdAndProvider(orgId, IntegrationProvider.GITHUB)
                .ifPresent(existing -> {
                    if (existing.getCredentialReference() != null) {
                        try { secretStore.delete(existing.getCredentialReference()); } catch (RuntimeException ignore) { }
                    }
                    integrationRepo.delete(existing);
                });

        Map<String, Object> config = new HashMap<>();
        config.put("mode", "PAT");
        Integration i = new Integration(orgId, IntegrationProvider.GITHUB, IntegrationStatus.PENDING,
                req.displayName() == null || req.displayName().isBlank() ? "GitHub" : req.displayName(),
                config, IntegrationSchedule.MANUAL, actor);
        i = integrationRepo.save(i);

        UUID credRef = secretStore.write(orgId, "github-pat/" + i.getId(),
                req.token().getBytes(StandardCharsets.UTF_8));
        i.setCredentialReference(credRef);

        audit.record(orgId, actor, AuditEvents.INTEGRATION_CREATED, "integration", i.getId(),
                Map.of("provider", "GITHUB", "mode", "PAT"));

        // eagerly test so the user gets an immediate CONNECTED / ERROR state
        TestResult tr = runTest(i);
        i.setLastTestedAt(Instant.now());
        i.setLastTestMessage(tr.message());
        i.setStatus(tr.ok() ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR);
        audit.record(orgId, actor, AuditEvents.INTEGRATION_TESTED, "integration", i.getId(),
                Map.of("ok", tr.ok()));
        return toResponse(integrationRepo.save(i));
    }

    @Transactional
    public TestConnectionResponse test(UUID integrationId) {
        Integration i = requireOwned(integrationId);
        TestResult tr = runTest(i);
        i.setLastTestedAt(Instant.now());
        i.setLastTestMessage(tr.message());
        i.setStatus(tr.ok() ? IntegrationStatus.CONNECTED : IntegrationStatus.ERROR);
        integrationRepo.save(i);
        audit.record(i.getOrganizationId(), TenantContext.require().userId(),
                AuditEvents.INTEGRATION_TESTED, "integration", i.getId(),
                Map.of("ok", tr.ok()));
        return new TestConnectionResponse(tr.ok(), i.getProvider(), tr.message(), i.getLastTestedAt());
    }

    @Transactional
    public UUID triggerCollection(UUID integrationId) {
        Integration i = requireOwned(integrationId);
        if (!collectorRegistry.has(i.getProvider())) {
            throw new ApiException(HttpStatus.NOT_IMPLEMENTED, "PROVIDER_UNAVAILABLE",
                    "Provider not yet implemented: " + i.getProvider());
        }
        CollectionRun run = runs.save(new CollectionRun(i.getOrganizationId(), i.getId(),
                TenantContext.require().userId()));
        audit.record(i.getOrganizationId(), TenantContext.require().userId(),
                AuditEvents.COLLECTION_STARTED, "collection_run", run.getId(),
                Map.of("provider", i.getProvider().name(), "integrationId", i.getId().toString()));
        collectionRunner.run(run.getId(), i.getId());
        return run.getId();
    }

    @Transactional
    public void disconnect(UUID integrationId) {
        Integration i = requireOwned(integrationId);
        i.setStatus(IntegrationStatus.DISCONNECTED);
        if (i.getCredentialReference() != null) {
            try { secretStore.delete(i.getCredentialReference()); } catch (RuntimeException ignore) { }
            i.setCredentialReference(null);
        }
        integrationRepo.save(i);
        audit.record(i.getOrganizationId(), TenantContext.require().userId(),
                AuditEvents.INTEGRATION_DISCONNECTED, "integration", i.getId(),
                Map.of("provider", i.getProvider().name()));
    }

    private TestResult runTest(Integration i) {
        if (i.getCredentialReference() == null) {
            return TestResult.fail("No credential stored");
        }
        try {
            EvidenceCollector collector = collectorRegistry.require(i.getProvider());
            byte[] cred = secretStore.read(i.getCredentialReference());
            return collector.test(new TestContext(cred, i.getConfiguration()));
        } catch (ApiException apiEx) {
            return TestResult.fail(apiEx.getMessage());
        } catch (RuntimeException e) {
            return TestResult.fail("Test failed: " + safeShort(e.getMessage()));
        }
    }

    private Integration requireOwned(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        return integrationRepo.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Integration not found"));
    }

    private static String safeShort(String s) {
        if (s == null) return "unknown";
        return s.length() > 200 ? s.substring(0, 200) : s;
    }

    private IntegrationResponse toResponse(Integration i) {
        return new IntegrationResponse(
                i.getId(), i.getProvider(), i.getStatus(), i.getDisplayName(),
                i.getConfiguration() == null ? Map.of() : i.getConfiguration(),
                i.getSchedule(), i.getLastTestedAt(), i.getLastTestMessage(),
                i.getLastCollectionAt(), i.getCreatedAt());
    }
}
