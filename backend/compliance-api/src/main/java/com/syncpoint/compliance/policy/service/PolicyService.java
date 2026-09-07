package com.syncpoint.compliance.policy.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.ApiException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.evidence.dto.CreateMappingRequest;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.entity.EvidenceSourceType;
import com.syncpoint.compliance.evidence.entity.MappingClassification;
import com.syncpoint.compliance.evidence.entity.MappingType;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import com.syncpoint.compliance.notification.service.EmailService;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.policy.dto.PolicyAcknowledgmentResponse;
import com.syncpoint.compliance.policy.dto.PolicyCoverageResponse;
import com.syncpoint.compliance.policy.dto.PolicyDetailResponse;
import com.syncpoint.compliance.policy.dto.PolicyResponse;
import com.syncpoint.compliance.policy.dto.UpdatePolicyRequest;
import com.syncpoint.compliance.policy.entity.Policy;
import com.syncpoint.compliance.policy.entity.PolicyAcknowledgment;
import com.syncpoint.compliance.policy.entity.PolicyCategory;
import com.syncpoint.compliance.policy.entity.PolicyStatus;
import com.syncpoint.compliance.policy.repository.PolicyAcknowledgmentRepository;
import com.syncpoint.compliance.policy.repository.PolicyCategoryRepository;
import com.syncpoint.compliance.policy.repository.PolicyRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PolicyService {

    private final PolicyRepository policyRepo;
    private final PolicyAcknowledgmentRepository ackRepo;
    private final PolicyCategoryRepository categoryRepo;
    private final OrganizationMemberRepository memberRepo;
    private final UserRepository userRepo;
    private final EvidenceService evidenceService;
    private final EvidenceControlMappingRepository mappingRepo;
    private final ControlRepository controlRepo;
    private final AuditService audit;
    private final PolicyAckTokenService ackTokenService;
    private final EmailService emailService;
    private final String frontendUrl;
    private final String notificationMode;

    public PolicyService(PolicyRepository policyRepo,
                         PolicyAcknowledgmentRepository ackRepo,
                         PolicyCategoryRepository categoryRepo,
                         OrganizationMemberRepository memberRepo,
                         UserRepository userRepo,
                         EvidenceService evidenceService,
                         EvidenceControlMappingRepository mappingRepo,
                         ControlRepository controlRepo,
                         AuditService audit,
                         PolicyAckTokenService ackTokenService,
                         EmailService emailService,
                         @Value("${syncpoint.frontend-url:http://localhost:4200}") String frontendUrl,
                         @Value("${syncpoint.policy.notification-mode:MAGIC_LINK}") String notificationMode) {
        this.policyRepo = policyRepo;
        this.ackRepo = ackRepo;
        this.categoryRepo = categoryRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
        this.evidenceService = evidenceService;
        this.mappingRepo = mappingRepo;
        this.controlRepo = controlRepo;
        this.audit = audit;
        this.ackTokenService = ackTokenService;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
        this.notificationMode = notificationMode;
    }

    @Transactional(readOnly = true)
    public List<PolicyResponse> list() {
        UUID orgId = TenantContext.require().organizationId();
        UUID actorId = TenantContext.require().userId();
        List<Policy> all = policyRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        int totalMembers = memberCount(orgId);

        Map<UUID, List<PolicyAcknowledgment>> acksByPolicy = ackRepo.findByOrganizationId(orgId).stream()
                .collect(Collectors.groupingBy(PolicyAcknowledgment::getPolicyId));

        Map<UUID, List<EvidenceControlMapping>> mappingsByEvidence = mappingRepo.findByOrganizationId(orgId).stream()
                .collect(Collectors.groupingBy(EvidenceControlMapping::getEvidenceId));

        Map<UUID, String> controlCodes = resolveControlCodes(mappingsByEvidence.values().stream()
                .flatMap(List::stream).map(EvidenceControlMapping::getControlId).collect(Collectors.toSet()));

        Set<UUID> ownerIds = all.stream().map(Policy::getOwnerUserId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, User> owners = ownerIds.isEmpty() ? Map.of() :
                userRepo.findAllById(ownerIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        return all.stream()
                .map(p -> toResponse(p, acksByPolicy.getOrDefault(p.getId(), List.of()),
                        mappingsByEvidence.getOrDefault(p.getEvidenceId(), List.of()),
                        controlCodes, owners, totalMembers, actorId))
                .toList();
    }

    @Transactional(readOnly = true)
    public PolicyDetailResponse get(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        UUID actorId = TenantContext.require().userId();
        Policy p = requireOwned(id);

        List<PolicyAcknowledgment> currentAcks = ackRepo.findByPolicyIdAndPolicyVersionAndAttestationCycle(
                p.getId(), p.getCurrentVersion(), p.getAttestationCycle());
        List<EvidenceControlMapping> mappings = p.getEvidenceId() == null ? List.of() :
                mappingRepo.findByEvidenceIdAndOrganizationId(p.getEvidenceId(), orgId);
        Map<UUID, String> controlCodes = resolveControlCodes(mappings.stream()
                .map(EvidenceControlMapping::getControlId).collect(Collectors.toSet()));
        Map<UUID, User> owners = p.getOwnerUserId() == null ? Map.of() :
                userRepo.findById(p.getOwnerUserId()).map(u -> Map.of(p.getOwnerUserId(), u)).orElse(Map.of());
        int totalMembers = memberCount(orgId);

        PolicyResponse response = toResponse(p, currentAcks, mappings, controlCodes, owners, totalMembers, actorId);

        List<OrganizationMember> members = memberRepo.findByOrganizationIdOrderByCreatedAtAsc(orgId);
        Map<UUID, Instant> ackTimes = currentAcks.stream()
                .collect(Collectors.toMap(PolicyAcknowledgment::getUserId, PolicyAcknowledgment::getAcknowledgedAt));
        Map<UUID, User> allUsers = members.isEmpty() ? Map.of() :
                userRepo.findAllById(members.stream().map(OrganizationMember::getUserId).toList()).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

        List<PolicyAcknowledgmentResponse> roster = members.stream()
                .map(m -> {
                    User u = allUsers.get(m.getUserId());
                    return new PolicyAcknowledgmentResponse(m.getUserId(),
                            u == null ? null : u.getName(), u == null ? null : u.getEmail(),
                            ackTimes.get(m.getUserId()));
                })
                .toList();

        return new PolicyDetailResponse(response, roster);
    }

    /** Standard AICPA-aligned category names, for the category picker \u2014 orgs may still type a custom value. */
    @Transactional(readOnly = true)
    public List<String> listCategories() {
        return categoryRepo.findAllByOrderBySortOrderAsc().stream().map(PolicyCategory::getName).toList();
    }

    /** Snaps a typed category to the lookup table's canonical casing (e.g. "access control" -> "Access Control") so coverage/category rollups don't fragment on case alone. Custom categories with no match pass through untouched. */
    private String normalizeCategory(String category) {
        String trimmed = category.trim();
        return categoryRepo.findByNameIgnoreCase(trimmed).map(PolicyCategory::getName).orElse(trimmed);
    }

    @Transactional
    public PolicyResponse create(String title, String category, String description, MultipartFile file) {
        TenantContext.Principal actor = TenantContext.require();
        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Title is required");
        }
        if (category == null || category.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Category is required");
        }
        String normalizedCategory = normalizeCategory(category);
        EvidenceResponse evidence = evidenceService.upload(title, description, file, EvidenceSourceType.POLICY, "policy");

        Policy policy = policyRepo.save(new Policy(actor.organizationId(), title.trim(), normalizedCategory, description,
                evidence.id(), actor.userId()));
        applySuggestedMappings(policy, evidence.id());

        audit.record(actor.organizationId(), actor.userId(), AuditEvents.POLICY_CREATED, "policy", policy.getId(),
                Map.of("title", policy.getTitle(), "category", normalizedCategory));
        notifyPendingMembers(policy);

        return toResponse(policy, List.of(), List.of(), Map.of(), Map.of(), memberCount(actor.organizationId()), actor.userId());
    }

    /** Auto-applies the canonical control suggestions for this policy's type as AI_SUGGESTED mappings. */
    private void applySuggestedMappings(Policy policy, UUID evidenceId) {
        Set<String> codes = PolicyControlSuggestions.suggestedCodesFor(policy.getTitle());
        if (codes.isEmpty()) return;
        for (Control control : controlRepo.findByCodeIn(codes)) {
            evidenceService.createMapping(evidenceId, new CreateMappingRequest(
                    control.getId(), MappingType.AI_SUGGESTED, MappingClassification.COVERED, null,
                    "Suggested based on policy type — review and confirm."));
        }
    }

    /** Bulk-confirms every still-suggested mapping for this policy in one action. */
    @Transactional
    public void confirmAllSuggested(UUID id) {
        Policy p = requireOwned(id);
        if (p.getEvidenceId() == null) return;
        List<EvidenceControlMapping> mappings =
                mappingRepo.findByEvidenceIdAndOrganizationId(p.getEvidenceId(), p.getOrganizationId());
        for (EvidenceControlMapping m : mappings) {
            if (m.getMappingType() == MappingType.AI_SUGGESTED) {
                evidenceService.confirmMapping(p.getEvidenceId(), m.getId());
            }
        }
    }

    /** Org-wide: how many of the active control catalog are backed by a CONFIRMED policy mapping. */
    @Transactional(readOnly = true)
    public PolicyCoverageResponse getCoverage() {
        UUID orgId = TenantContext.require().organizationId();
        List<Policy> published = policyRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .filter(p -> p.getStatus() == PolicyStatus.PUBLISHED && p.getEvidenceId() != null)
                .toList();
        Set<UUID> evidenceIds = published.stream().map(Policy::getEvidenceId).collect(Collectors.toSet());
        Set<UUID> coveredControlIds = mappingRepo.findByOrganizationId(orgId).stream()
                .filter(m -> evidenceIds.contains(m.getEvidenceId()) && m.getMappingType() == MappingType.HUMAN_CONFIRMED)
                .map(EvidenceControlMapping::getControlId)
                .collect(Collectors.toSet());
        List<Control> allControls = controlRepo.findByActiveTrueOrderByCode();
        List<String> covered = allControls.stream()
                .filter(c -> coveredControlIds.contains(c.getId())).map(Control::getCode).toList();
        List<String> uncovered = allControls.stream()
                .filter(c -> !coveredControlIds.contains(c.getId())).map(Control::getCode).toList();
        return new PolicyCoverageResponse(allControls.size(), covered.size(), covered, uncovered);
    }

    @Transactional
    public PolicyResponse addVersion(UUID id, MultipartFile file) {
        TenantContext.Principal actor = TenantContext.require();
        Policy p = requireOwned(id);
        if (p.getEvidenceId() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "NO_DOCUMENT", "Policy has no document to version");
        }
        evidenceService.addVersion(p.getEvidenceId(), file);
        p.setCurrentVersion(p.getCurrentVersion() + 1);
        policyRepo.save(p);

        audit.record(p.getOrganizationId(), actor.userId(), AuditEvents.POLICY_VERSION_UPLOADED, "policy", p.getId(),
                Map.of("version", p.getCurrentVersion()));
        notifyPendingMembers(p);

        return get(id).policy();
    }

    @Transactional
    public PolicyResponse acknowledge(UUID id) {
        TenantContext.Principal actor = TenantContext.require();
        Policy p = requireOwned(id);
        acknowledgeAs(p, actor.userId());
        return get(id).policy();
    }

    /** Shared by the in-app acknowledge action and the login-free portal acknowledge action. */
    void acknowledgeAs(Policy p, UUID userId) {
        boolean already = ackRepo.findByPolicyIdAndPolicyVersionAndAttestationCycleAndUserId(
                p.getId(), p.getCurrentVersion(), p.getAttestationCycle(), userId).isPresent();
        if (!already) {
            ackRepo.save(new PolicyAcknowledgment(p.getOrganizationId(), p.getId(), p.getCurrentVersion(),
                    p.getAttestationCycle(), userId));
            audit.record(p.getOrganizationId(), userId, AuditEvents.POLICY_ACKNOWLEDGED, "policy", p.getId(),
                    Map.of("version", p.getCurrentVersion(), "attestationCycle", p.getAttestationCycle()));
        }
    }

    @Transactional
    public void sendReminder(UUID id) {
        Policy p = requireOwned(id);
        Instant now = Instant.now();
        if (p.getLastReminderSentAt() != null && p.getLastReminderSentAt().isAfter(now.minus(1, ChronoUnit.HOURS))) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "REMINDER_COOLDOWN",
                    "A reminder was already sent recently for this policy. Try again later.");
        }
        p.setLastReminderSentAt(now);
        policyRepo.save(p);
        audit.record(p.getOrganizationId(), TenantContext.require().userId(), AuditEvents.POLICY_REMINDER_SENT,
                "policy", p.getId(), Map.of());
        notifyPendingMembers(p);
    }

    /**
     * Emails a fresh portal magic link to every member who has not yet acknowledged this policy's
     * current version/attestation cycle. Funnels "who must acknowledge" through this one method so
     * a future IdP-group/HRIS-driven audience can replace the member lookup without touching
     * anything else.
     */
    void notifyPendingMembers(Policy p) {
        List<OrganizationMember> members = memberRepo.findByOrganizationIdOrderByCreatedAtAsc(p.getOrganizationId());
        if (members.isEmpty()) return;
        Set<UUID> ackedUserIds = ackRepo
                .findByPolicyIdAndPolicyVersionAndAttestationCycle(p.getId(), p.getCurrentVersion(), p.getAttestationCycle())
                .stream().map(PolicyAcknowledgment::getUserId).collect(Collectors.toSet());
        List<UUID> pendingUserIds = members.stream()
                .map(OrganizationMember::getUserId)
                .filter(userId -> !ackedUserIds.contains(userId))
                .toList();
        if (pendingUserIds.isEmpty()) return;

        Map<UUID, User> usersById = userRepo.findAllById(pendingUserIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        for (UUID userId : pendingUserIds) {
            User u = usersById.get(userId);
            if (u == null) continue;
            String link = "LOGIN".equalsIgnoreCase(notificationMode)
                    ? frontendUrl + "/login?redirectTo=/my-policies"
                    : frontendUrl + "/policy-portal?token=" + ackTokenService.issue(p.getOrganizationId(), userId, Duration.ofDays(30));
            emailService.sendPolicyAcknowledgmentEmail(u.getEmail(), p.getTitle(), link);
        }
    }

    @Transactional
    public PolicyResponse update(UUID id, UpdatePolicyRequest req) {
        TenantContext.Principal actor = TenantContext.require();
        Policy p = requireOwned(id);
        p.setCategory(normalizeCategory(req.category()));
        p.setDescription(req.description());
        p.setOwnerUserId(req.ownerUserId());
        p.setNextReviewDate(req.nextReviewDate());
        policyRepo.save(p);

        audit.record(p.getOrganizationId(), actor.userId(), AuditEvents.POLICY_UPDATED, "policy", p.getId(), Map.of());
        return get(id).policy();
    }

    @Transactional
    public PolicyResponse archive(UUID id) {
        TenantContext.Principal actor = TenantContext.require();
        Policy p = requireOwned(id);
        p.setStatus(PolicyStatus.ARCHIVED);
        policyRepo.save(p);

        audit.record(p.getOrganizationId(), actor.userId(), AuditEvents.POLICY_ARCHIVED, "policy", p.getId(), Map.of());
        return get(id).policy();
    }

    private Map<UUID, String> resolveControlCodes(Set<UUID> controlIds) {
        if (controlIds.isEmpty()) return Map.of();
        return controlRepo.findAllById(controlIds).stream()
                .collect(Collectors.toMap(Control::getId, Control::getCode));
    }

    private int memberCount(UUID orgId) {
        return memberRepo.findByOrganizationIdOrderByCreatedAtAsc(orgId).size();
    }

    private PolicyResponse toResponse(Policy p, List<PolicyAcknowledgment> acks,
                                      List<EvidenceControlMapping> mappings,
                                      Map<UUID, String> controlCodes,
                                      Map<UUID, User> owners,
                                      int totalMembers, UUID actorId) {
        List<String> mappedCodes = mappings.stream()
                .map(m -> controlCodes.get(m.getControlId()))
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();
        List<PolicyAcknowledgment> currentAcks = acks.stream()
                .filter(a -> a.getPolicyVersion() == p.getCurrentVersion() && a.getAttestationCycle() == p.getAttestationCycle())
                .toList();
        boolean ackedByMe = currentAcks.stream().anyMatch(a -> a.getUserId().equals(actorId));
        User owner = p.getOwnerUserId() == null ? null : owners.get(p.getOwnerUserId());
        return new PolicyResponse(
                p.getId(), p.getTitle(), p.getCategory(), p.getDescription(), p.getStatus(),
                p.getOwnerUserId(), owner == null ? null : owner.getName(), p.getNextReviewDate(),
                p.getCurrentVersion(), p.getEvidenceId(), mappedCodes,
                currentAcks.size(), totalMembers, ackedByMe, p.getCreatedAt(), p.getUpdatedAt());
    }

    private Policy requireOwned(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        return policyRepo.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Policy not found"));
    }
}
