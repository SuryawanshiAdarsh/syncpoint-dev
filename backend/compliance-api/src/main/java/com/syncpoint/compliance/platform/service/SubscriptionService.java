package com.syncpoint.compliance.platform.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.common.exception.ConflictException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.platform.dto.CreateSubscriptionRequestRequest;
import com.syncpoint.compliance.platform.dto.SubscriptionRequestResponse;
import com.syncpoint.compliance.platform.dto.SubscriptionResponse;
import com.syncpoint.compliance.platform.entity.Subscription;
import com.syncpoint.compliance.platform.entity.SubscriptionRequest;
import com.syncpoint.compliance.platform.entity.SubscriptionRequestStatus;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;
import com.syncpoint.compliance.platform.repository.SubscriptionRepository;
import com.syncpoint.compliance.platform.repository.SubscriptionRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Tenant-facing subscription visibility + change requests (Settings > Billing). Unlike
 * {@link PlatformAdminService} / {@link SubscriptionRequestAdminService} (cross-tenant,
 * platform-admin-only), every method here reads the org id off {@link TenantContext} and is
 * scoped to the caller's own organization.
 *
 * There is no payment processor wired up yet (Phase 2 / Stripe, deferred) and no self-service
 * mutation either: an org can only *propose* a plan/seat change here. A platform admin reviews
 * and applies it via {@link SubscriptionRequestAdminService}.
 */
@Service
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionRequestRepository requestRepository;
    private final AuditService auditService;

    public SubscriptionService(SubscriptionRepository subscriptionRepository,
                                SubscriptionRequestRepository requestRepository,
                                AuditService auditService) {
        this.subscriptionRepository = subscriptionRepository;
        this.requestRepository = requestRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse current() {
        return toResponse(getCurrentSubscription());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionRequestResponse> listRequests() {
        UUID orgId = TenantContext.require().organizationId();
        return requestRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .map(this::toRequestResponse)
                .toList();
    }

    @Transactional
    public SubscriptionRequestResponse requestChange(CreateSubscriptionRequestRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        if (requestRepository.findByOrganizationIdAndStatus(orgId, SubscriptionRequestStatus.PENDING).isPresent()) {
            throw new ConflictException("A subscription request is already pending review.");
        }

        TenantContext.Principal actor = TenantContext.require();
        SubscriptionRequest request = new SubscriptionRequest(
                orgId, actor.userId(), req.requestedPlan(), req.requestedSeatLimit(), req.note());
        requestRepository.save(request);

        auditService.record(orgId, actor.userId(), AuditEvents.SUBSCRIPTION_RENEWAL_REQUESTED,
                "subscription_request", request.getId());

        return toRequestResponse(request);
    }

    @Transactional
    public void revokeRequest(UUID requestId) {
        UUID orgId = TenantContext.require().organizationId();
        SubscriptionRequest request = requestRepository.findByOrganizationIdAndStatus(orgId, SubscriptionRequestStatus.PENDING)
                .filter(r -> r.getId().equals(requestId))
                .orElseThrow(() -> new NotFoundException("No pending request found to revoke."));

        request.cancel();
        requestRepository.save(request);

        TenantContext.Principal actor = TenantContext.require();
        auditService.record(orgId, actor.userId(), AuditEvents.SUBSCRIPTION_RENEWAL_CANCELED,
                "subscription_request", request.getId());
    }

    private Subscription getCurrentSubscription() {
        UUID orgId = TenantContext.require().organizationId();
        return subscriptionRepository.findByOrganizationId(orgId)
                .orElseThrow(() -> new NotFoundException("Subscription not found"));
    }

    private SubscriptionResponse toResponse(Subscription sub) {
        return new SubscriptionResponse(
                sub.getPlan(),
                sub.getStatus(),
                sub.getSeatLimit(),
                sub.getTrialEndsAt(),
                sub.getCurrentPeriodStart(),
                sub.getCurrentPeriodEnd(),
                sub.getStatus() != SubscriptionStatus.CANCELED);
    }

    private SubscriptionRequestResponse toRequestResponse(SubscriptionRequest r) {
        return new SubscriptionRequestResponse(
                r.getId(), r.getRequestedPlan(), r.getRequestedSeatLimit(), r.getNote(),
                r.getStatus(), r.getReviewNote(), r.getCreatedAt(), r.getReviewedAt());
    }
}
