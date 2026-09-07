package com.syncpoint.compliance.policy.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.policy.entity.Policy;
import com.syncpoint.compliance.policy.entity.PolicyStatus;
import com.syncpoint.compliance.policy.repository.PolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Annual re-attestation: a published policy's acknowledgments must be renewed ~12 months after
 * the current attestation cycle started, independent of the document version. Tenant-free (like
 * CoverageSnapshotSweep) since it runs across all organizations outside any request context.
 */
@Component
public class PolicyReattestationSweep {

    private static final Logger log = LoggerFactory.getLogger(PolicyReattestationSweep.class);
    private static final int REATTESTATION_DAYS = 365;

    private final PolicyRepository policyRepo;
    private final PolicyService policyService;
    private final AuditService audit;

    public PolicyReattestationSweep(PolicyRepository policyRepo, PolicyService policyService, AuditService audit) {
        this.policyRepo = policyRepo;
        this.policyService = policyService;
        this.audit = audit;
    }

    @Scheduled(cron = "${syncpoint.policy.reattestation-sweep-cron:0 0 3 * * *}")
    @Transactional
    public void run() {
        Instant cutoff = Instant.now().minus(REATTESTATION_DAYS, ChronoUnit.DAYS);
        List<Policy> due = policyRepo.findByStatusAndCycleStartedAtBefore(PolicyStatus.PUBLISHED, cutoff);
        for (Policy p : due) {
            int newCycle = p.getAttestationCycle() + 1;
            p.setAttestationCycle(newCycle);
            p.setCycleStartedAt(Instant.now());
            policyRepo.save(p);

            audit.record(p.getOrganizationId(), p.getCreatedBy(), AuditEvents.POLICY_REATTESTATION_CYCLE_STARTED,
                    "policy", p.getId(), Map.of("attestationCycle", newCycle));
            policyService.notifyPendingMembers(p);
        }
        if (!due.isEmpty()) {
            log.info("Policy re-attestation sweep started a new cycle for {} polic{}", due.size(), due.size() == 1 ? "y" : "ies");
        }
    }
}
