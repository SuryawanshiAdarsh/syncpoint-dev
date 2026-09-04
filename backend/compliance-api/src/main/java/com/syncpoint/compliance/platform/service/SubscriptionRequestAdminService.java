package com.syncpoint.compliance.platform.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.ConflictException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import com.syncpoint.compliance.platform.dto.AdminSubscriptionRequestResponse;
import com.syncpoint.compliance.platform.dto.RejectSubscriptionRequestRequest;
import com.syncpoint.compliance.platform.entity.Subscription;
import com.syncpoint.compliance.platform.entity.SubscriptionRequest;
import com.syncpoint.compliance.platform.entity.SubscriptionRequestStatus;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;
import com.syncpoint.compliance.platform.repository.SubscriptionRepository;
import com.syncpoint.compliance.platform.repository.SubscriptionRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Platform-admin review queue for tenant subscription requests. Approval is the only path that
 * ever mutates a {@link Subscription}: it applies the requested plan + seat count and extends the
 * period by 30 days from whichever is later, now or the current period end (same "manual renewal
 * until Stripe ships" logic the old self-service renew button used, just gated behind a human).
 */
@Service
public class SubscriptionRequestAdminService {

    private static final Duration RENEWAL_PERIOD = Duration.ofDays(30);

    private final SubscriptionRequestRepository requestRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public SubscriptionRequestAdminService(SubscriptionRequestRepository requestRepository,
                                            SubscriptionRepository subscriptionRepository,
                                            OrganizationRepository organizationRepository,
                                            UserRepository userRepository,
                                            AuditService auditService) {
        this.requestRepository = requestRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<AdminSubscriptionRequestResponse> listPending() {
        return toResponses(requestRepository.findByStatusOrderByCreatedAtAsc(SubscriptionRequestStatus.PENDING));
    }

    @Transactional(readOnly = true)
    public List<AdminSubscriptionRequestResponse> listAll() {
        return toResponses(requestRepository.findAllByOrderByCreatedAtDesc());
    }

    @Transactional
    public AdminSubscriptionRequestResponse approve(UUID requestId) {
        SubscriptionRequest request = getPendingRequest(requestId);
        Subscription sub = subscriptionRepository.findByOrganizationId(request.getOrganizationId())
                .orElseThrow(() -> new NotFoundException("Subscription not found"));

        Instant now = Instant.now();
        Instant base = sub.getCurrentPeriodEnd() != null && sub.getCurrentPeriodEnd().isAfter(now)
                ? sub.getCurrentPeriodEnd() : now;
        sub.setPlan(request.getRequestedPlan());
        sub.setSeatLimit(request.getRequestedSeatLimit());
        sub.setCurrentPeriodStart(now);
        sub.setCurrentPeriodEnd(base.plus(RENEWAL_PERIOD));
        sub.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(sub);

        UUID reviewerId = TenantContext.require().userId();
        request.approve(reviewerId);
        requestRepository.save(request);

        auditService.record(request.getOrganizationId(), reviewerId, AuditEvents.SUBSCRIPTION_RENEWAL_APPROVED,
                "subscription_request", request.getId());

        return toResponse(request, sub);
    }

    @Transactional
    public AdminSubscriptionRequestResponse reject(UUID requestId, RejectSubscriptionRequestRequest req) {
        SubscriptionRequest request = getPendingRequest(requestId);
        UUID reviewerId = TenantContext.require().userId();
        request.reject(reviewerId, req.reviewNote());
        requestRepository.save(request);

        auditService.record(request.getOrganizationId(), reviewerId, AuditEvents.SUBSCRIPTION_RENEWAL_REJECTED,
                "subscription_request", request.getId());

        Subscription sub = subscriptionRepository.findByOrganizationId(request.getOrganizationId()).orElse(null);
        return toResponse(request, sub);
    }

    private SubscriptionRequest getPendingRequest(UUID requestId) {
        SubscriptionRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Subscription request not found"));
        if (request.getStatus() != SubscriptionRequestStatus.PENDING) {
            throw new ConflictException("This request has already been reviewed.");
        }
        return request;
    }

    private List<AdminSubscriptionRequestResponse> toResponses(List<SubscriptionRequest> requests) {
        if (requests.isEmpty()) return List.of();

        List<UUID> orgIds = requests.stream().map(SubscriptionRequest::getOrganizationId).distinct().toList();
        Map<UUID, Organization> orgsById = organizationRepository.findAllById(orgIds).stream()
                .collect(Collectors.toMap(Organization::getId, o -> o));
        Map<UUID, Subscription> subsByOrg = subscriptionRepository.findByOrganizationIdIn(orgIds).stream()
                .collect(Collectors.toMap(Subscription::getOrganizationId, s -> s));

        List<UUID> userIds = requests.stream().map(SubscriptionRequest::getRequestedBy).distinct().toList();
        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        return requests.stream()
                .map(r -> toResponse(r, orgsById.get(r.getOrganizationId()), subsByOrg.get(r.getOrganizationId()),
                        usersById.get(r.getRequestedBy())))
                .toList();
    }

    private AdminSubscriptionRequestResponse toResponse(SubscriptionRequest r, Subscription sub) {
        Organization org = organizationRepository.findById(r.getOrganizationId()).orElse(null);
        User requester = userRepository.findById(r.getRequestedBy()).orElse(null);
        return toResponse(r, org, sub, requester);
    }

    private AdminSubscriptionRequestResponse toResponse(SubscriptionRequest r, Organization org, Subscription sub,
                                                         User requester) {
        return new AdminSubscriptionRequestResponse(
                r.getId(),
                r.getOrganizationId(),
                org != null ? org.getName() : "(unknown)",
                org != null ? org.getSlug() : "(unknown)",
                sub != null ? sub.getPlan() : null,
                sub != null ? sub.getSeatLimit() : null,
                requester != null ? requester.getName() : "(unknown)",
                requester != null ? requester.getEmail() : "(unknown)",
                r.getRequestedPlan(),
                r.getRequestedSeatLimit(),
                r.getNote(),
                r.getStatus(),
                r.getReviewNote(),
                r.getCreatedAt(),
                r.getReviewedAt());
    }
}
