package com.syncpoint.compliance.platform.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.compliance.service.ControlStatusResolver;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.integrations.entity.Integration;
import com.syncpoint.compliance.integrations.entity.IntegrationStatus;
import com.syncpoint.compliance.integrations.repository.IntegrationRepository;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import com.syncpoint.compliance.platform.dto.AdminMemberSummary;
import com.syncpoint.compliance.platform.dto.AdminOrganizationDetail;
import com.syncpoint.compliance.platform.dto.AdminOrganizationSummary;
import com.syncpoint.compliance.platform.dto.UpdateSubscriptionRequest;
import com.syncpoint.compliance.platform.entity.Subscription;
import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;
import com.syncpoint.compliance.platform.repository.SubscriptionRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Cross-tenant read/write access for Syncpoint-the-company to monitor its own customers
 * (plan, status, usage, expiry). Every method here deliberately takes an explicit
 * organizationId rather than reading it off {@link com.syncpoint.compliance.common.tenant.TenantContext},
 * mirroring {@link com.syncpoint.compliance.compliance.service.CoverageSnapshotSweep}'s
 * tenant-free pattern, since a platform admin operates across all orgs, not just their own.
 */
@Service
public class PlatformAdminService {

    private final OrganizationRepository organizationRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final EvidenceRepository evidenceRepository;
    private final IntegrationRepository integrationRepository;
    private final ControlRepository controlRepository;
    private final ControlStatusResolver statusResolver;
    private final AuditService auditService;

    public PlatformAdminService(OrganizationRepository organizationRepository,
                                SubscriptionRepository subscriptionRepository,
                                OrganizationMemberRepository memberRepository,
                                UserRepository userRepository,
                                EvidenceRepository evidenceRepository,
                                IntegrationRepository integrationRepository,
                                ControlRepository controlRepository,
                                ControlStatusResolver statusResolver,
                                AuditService auditService) {
        this.organizationRepository = organizationRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.evidenceRepository = evidenceRepository;
        this.integrationRepository = integrationRepository;
        this.controlRepository = controlRepository;
        this.statusResolver = statusResolver;
        this.auditService = auditService;
    }

    public List<AdminOrganizationSummary> listOrganizations() {
        List<Organization> orgs = organizationRepository.findAll();
        List<UUID> orgIds = orgs.stream().map(Organization::getId).toList();
        Map<UUID, Subscription> subsByOrg = subscriptionRepository.findByOrganizationIdIn(orgIds).stream()
                .collect(Collectors.toMap(Subscription::getOrganizationId, s -> s));
        return orgs.stream().map(org -> toSummary(org, subsByOrg.get(org.getId()))).toList();
    }

    public AdminOrganizationDetail getOrganization(UUID organizationId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));
        Subscription sub = subscriptionRepository.findByOrganizationId(organizationId).orElse(null);
        AdminOrganizationSummary summary = toSummary(org, sub);

        List<OrganizationMember> members = memberRepository.findByOrganizationIdOrderByCreatedAtAsc(organizationId);
        Map<UUID, User> usersById = userRepository.findAllById(members.stream().map(OrganizationMember::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        List<AdminMemberSummary> memberSummaries = members.stream()
                .map(m -> {
                    User u = usersById.get(m.getUserId());
                    return new AdminMemberSummary(
                            m.getUserId(),
                            u != null ? u.getName() : "(unknown)",
                            u != null ? u.getEmail() : "(unknown)",
                            m.getRole().name(),
                            m.getCreatedAt());
                })
                .toList();

        return new AdminOrganizationDetail(summary, memberSummaries);
    }

    @Transactional
    public AdminOrganizationSummary updateSubscription(UUID organizationId, UUID actorUserId, UpdateSubscriptionRequest req) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Organization not found"));
        Subscription sub = subscriptionRepository.findByOrganizationId(organizationId)
                .orElseGet(() -> new Subscription(organizationId, req.plan(), req.status(), req.trialEndsAt()));

        sub.setPlan(req.plan());
        sub.setStatus(req.status());
        sub.setSeatLimit(req.seatLimit());
        sub.setTrialEndsAt(req.trialEndsAt());
        sub.setCurrentPeriodEnd(req.currentPeriodEnd());
        subscriptionRepository.save(sub);

        auditService.record(organizationId, actorUserId, AuditEvents.SUBSCRIPTION_UPDATED, "subscription", sub.getId());

        return toSummary(org, sub);
    }

    private AdminOrganizationSummary toSummary(Organization org, Subscription sub) {
        int userCount = memberRepository.findByOrganizationIdOrderByCreatedAtAsc(org.getId()).size();
        int evidenceCount = (int) evidenceRepository.countByOrganizationId(org.getId());
        List<Integration> integrations = integrationRepository.findByOrganizationIdOrderByCreatedAt(org.getId());
        int integrationCount = integrations.size();
        int connectedIntegrationCount = (int) integrations.stream()
                .filter(i -> i.getStatus() == IntegrationStatus.CONNECTED)
                .count();

        List<Control> activeControls = controlRepository.findByActiveTrueOrderByCode();
        int coveragePercent = 0;
        if (!activeControls.isEmpty()) {
            List<UUID> controlIds = activeControls.stream().map(Control::getId).toList();
            Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(org.getId(), controlIds);
            long covered = statuses.values().stream().filter(s -> s == ControlStatus.COVERED).count();
            coveragePercent = Math.round((covered * 100f) / activeControls.size());
        }

        return new AdminOrganizationSummary(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getCreatedAt(),
                sub != null ? sub.getPlan() : SubscriptionPlan.TRIAL,
                sub != null ? sub.getStatus() : SubscriptionStatus.TRIALING,
                sub != null ? sub.getSeatLimit() : null,
                sub != null ? sub.getTrialEndsAt() : null,
                sub != null ? sub.getCurrentPeriodEnd() : null,
                userCount,
                evidenceCount,
                integrationCount,
                connectedIntegrationCount,
                coveragePercent);
    }
}
