package com.syncpoint.compliance.policy.service;

import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.repository.EvidenceVersionRepository;
import com.syncpoint.compliance.policy.dto.PolicyPortalDetailResponse;
import com.syncpoint.compliance.policy.dto.PolicyPortalItemResponse;
import com.syncpoint.compliance.policy.dto.PolicyPortalPageResponse;
import com.syncpoint.compliance.policy.entity.Policy;
import com.syncpoint.compliance.policy.entity.PolicyAckToken;
import com.syncpoint.compliance.policy.entity.PolicyAcknowledgment;
import com.syncpoint.compliance.policy.entity.PolicyStatus;
import com.syncpoint.compliance.policy.repository.PolicyAcknowledgmentRepository;
import com.syncpoint.compliance.policy.repository.PolicyRepository;
import com.syncpoint.compliance.storage.ObjectStorageService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Backs BOTH policy acknowledgment entry points: the login-free magic-link portal (identity
 * resolved from a {@link PolicyAckTokenService} token) and the real-login "My Policies" view
 * (identity resolved from {@code TenantContext}, i.e. a normal authenticated session). Which one
 * a given org uses is a deployment choice (see {@code syncpoint.policy.notification-mode}); both
 * share this exact same read/acknowledge logic once identity is resolved, so behavior is
 * identical regardless of how the person got here.
 */
@Service
public class PolicyPortalService {

    private final PolicyAckTokenService tokenService;
    private final PolicyRepository policyRepo;
    private final PolicyAcknowledgmentRepository ackRepo;
    private final EvidenceVersionRepository versionRepo;
    private final ObjectStorageService storage;
    private final PolicyService policyService;

    public PolicyPortalService(PolicyAckTokenService tokenService,
                               PolicyRepository policyRepo,
                               PolicyAcknowledgmentRepository ackRepo,
                               EvidenceVersionRepository versionRepo,
                               ObjectStorageService storage,
                               PolicyService policyService) {
        this.tokenService = tokenService;
        this.policyRepo = policyRepo;
        this.ackRepo = ackRepo;
        this.versionRepo = versionRepo;
        this.storage = storage;
        this.policyService = policyService;
    }

    // ─── Magic-link (login-free) entry points ──────────────────────────

    @Transactional(readOnly = true)
    public PolicyPortalPageResponse list(String rawToken, int page, int size) {
        PolicyAckToken token = tokenService.resolve(rawToken);
        return listFor(token.getOrganizationId(), token.getUserId(), page, size);
    }

    @Transactional(readOnly = true)
    public PolicyPortalDetailResponse get(String rawToken, UUID policyId) {
        PolicyAckToken token = tokenService.resolve(rawToken);
        return getFor(token.getOrganizationId(), token.getUserId(), policyId);
    }

    @Transactional(readOnly = true)
    public DocumentContent document(String rawToken, UUID policyId) {
        PolicyAckToken token = tokenService.resolve(rawToken);
        return documentFor(token.getOrganizationId(), policyId);
    }

    @Transactional
    public void acknowledge(String rawToken, UUID policyId) {
        PolicyAckToken token = tokenService.resolve(rawToken);
        acknowledgeFor(token.getOrganizationId(), token.getUserId(), policyId);
    }

    // ─── Real-login ("My Policies") entry points ───────────────────────

    @Transactional(readOnly = true)
    public PolicyPortalPageResponse listMine(int page, int size) {
        TenantContext.Principal actor = TenantContext.require();
        return listFor(actor.organizationId(), actor.userId(), page, size);
    }

    @Transactional(readOnly = true)
    public PolicyPortalDetailResponse getMine(UUID policyId) {
        TenantContext.Principal actor = TenantContext.require();
        return getFor(actor.organizationId(), actor.userId(), policyId);
    }

    @Transactional(readOnly = true)
    public DocumentContent documentMine(UUID policyId) {
        UUID orgId = TenantContext.require().organizationId();
        return documentFor(orgId, policyId);
    }

    @Transactional
    public void acknowledgeMine(UUID policyId) {
        TenantContext.Principal actor = TenantContext.require();
        acknowledgeFor(actor.organizationId(), actor.userId(), policyId);
    }

    // ─── Shared core ────────────────────────────────────────────────────

    private PolicyPortalPageResponse listFor(UUID organizationId, UUID userId, int page, int size) {
        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 0);
        Page<Policy> result = policyRepo.findByOrganizationIdAndStatusOrderByCreatedAtDesc(
                organizationId, PolicyStatus.PUBLISHED, PageRequest.of(safePage, safeSize));

        var items = result.getContent().stream().map(p -> toItem(p, userId)).toList();
        return new PolicyPortalPageResponse(items, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    private PolicyPortalDetailResponse getFor(UUID organizationId, UUID userId, UUID policyId) {
        Policy p = requireInOrg(policyId, organizationId);
        PolicyPortalItemResponse item = toItem(p, userId);
        return new PolicyPortalDetailResponse(p.getId(), p.getTitle(), p.getCategory(), p.getDescription(),
                p.getCurrentVersion(), item.status(), p.getEvidenceId() != null);
    }

    private DocumentContent documentFor(UUID organizationId, UUID policyId) {
        Policy p = requireInOrg(policyId, organizationId);
        if (p.getEvidenceId() == null) {
            throw new NotFoundException("This policy has no document");
        }
        EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(p.getEvidenceId())
                .orElseThrow(() -> new NotFoundException("This policy has no document"));
        byte[] bytes = storage.get(v.getStorageKey());
        return new DocumentContent(bytes, v.getMimeType() == null ? "application/octet-stream" : v.getMimeType());
    }

    private void acknowledgeFor(UUID organizationId, UUID userId, UUID policyId) {
        Policy p = requireInOrg(policyId, organizationId);
        policyService.acknowledgeAs(p, userId);
    }

    private Policy requireInOrg(UUID policyId, UUID organizationId) {
        return policyRepo.findByIdAndOrganizationId(policyId, organizationId)
                .orElseThrow(() -> new NotFoundException("Policy not found"));
    }

    private PolicyPortalItemResponse toItem(Policy p, UUID userId) {
        Optional<PolicyAcknowledgment> ack = ackRepo.findByPolicyIdAndPolicyVersionAndAttestationCycleAndUserId(
                p.getId(), p.getCurrentVersion(), p.getAttestationCycle(), userId);
        Instant ackedAt = ack.map(PolicyAcknowledgment::getAcknowledgedAt).orElse(null);
        return new PolicyPortalItemResponse(p.getId(), p.getTitle(), p.getCategory(), p.getCurrentVersion(),
                ack.isPresent() ? "ACKNOWLEDGED" : "PENDING", ackedAt);
    }

    public record DocumentContent(byte[] bytes, String mimeType) {
    }
}
