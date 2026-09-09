package com.syncpoint.compliance.auditor.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Auditor engagements are time-boxed (OrganizationMember.accessExpiresAt) — this sweep revokes
 * access the moment it lapses instead of relying on someone remembering to remove the member by
 * hand. Tenant-free (like CoverageSnapshotSweep/PolicyReattestationSweep) since it runs across all
 * organizations outside any request context.
 */
@Component
public class AuditorAccessExpirySweep {

    private static final Logger log = LoggerFactory.getLogger(AuditorAccessExpirySweep.class);

    private final OrganizationMemberRepository members;
    private final AuditService auditService;

    public AuditorAccessExpirySweep(OrganizationMemberRepository members, AuditService auditService) {
        this.members = members;
        this.auditService = auditService;
    }

    @Scheduled(cron = "${syncpoint.auditor.access-expiry-sweep-cron:0 0 4 * * *}")
    @Transactional
    public void run() {
        List<OrganizationMember> expired = members.findByAccessExpiresAtIsNotNullAndAccessExpiresAtBefore(Instant.now());
        for (OrganizationMember m : expired) {
            auditService.record(m.getOrganizationId(), m.getUserId(), AuditEvents.AUDITOR_ACCESS_EXPIRED,
                    "organization_member", m.getId());
        }
        if (!expired.isEmpty()) {
            members.deleteAll(expired);
            log.info("Auditor access-expiry sweep revoked {} expired membership(s)", expired.size());
        }
    }
}
