package com.syncpoint.compliance.organization.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.TokenPurpose;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.auth.service.AuthTokenService;
import com.syncpoint.compliance.common.exception.ConflictException;
import com.syncpoint.compliance.common.exception.ForbiddenException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.common.util.ByteArrayMultipartFile;
import com.syncpoint.compliance.evidence.entity.EvidenceSourceType;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import com.syncpoint.compliance.notification.service.EmailService;
import com.syncpoint.compliance.organization.dto.AddMemberRequest;
import com.syncpoint.compliance.organization.dto.MemberResponse;
import com.syncpoint.compliance.organization.dto.OrganizationResponse;
import com.syncpoint.compliance.organization.dto.UpdateComplianceProgramRequest;
import com.syncpoint.compliance.organization.dto.UpdateMemberRoleRequest;
import com.syncpoint.compliance.organization.dto.UpdateOrganizationRequest;
import com.syncpoint.compliance.organization.dto.UpdateAuditorInfoRequest;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.entity.ReportType;
import com.syncpoint.compliance.organization.entity.Role;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final AuthTokenService authTokenService;
    private final EmailService emailService;
    private final EvidenceService evidenceService;
    private final String frontendUrl;

    public OrganizationService(OrganizationRepository organizationRepository,
                               OrganizationMemberRepository memberRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuditService auditService,
                               AuthTokenService authTokenService,
                               EmailService emailService,
                               EvidenceService evidenceService,
                               @Value("${syncpoint.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.authTokenService = authTokenService;
        this.emailService = emailService;
        this.evidenceService = evidenceService;
        this.frontendUrl = frontendUrl;
    }

    @Transactional(readOnly = true)
    public OrganizationResponse current() {
        Organization org = getCurrentOrganization();
        return toResponse(org);
    }

    @Transactional
    public OrganizationResponse updateCurrent(UpdateOrganizationRequest req) {
        Organization org = getCurrentOrganization();
        org.setName(req.name().trim());
        return toResponse(organizationRepository.save(org));
    }

    @Transactional
    public OrganizationResponse updateComplianceProgram(UpdateComplianceProgramRequest req) {
        Organization org = getCurrentOrganization();
        if (req.tscScopeExtra() != null) {
            org.setTscScopeExtra(String.join(",", req.tscScopeExtra()));
        }
        if (req.reportType() != null) {
            org.setReportType(ReportType.valueOf(req.reportType()));
        }
        org.setObservationPeriodStart(req.observationPeriodStart());
        org.setObservationPeriodEnd(req.observationPeriodEnd());
        org.setTargetReportDate(req.targetReportDate());
        org.setServicesProvided(req.servicesProvided());
        org.setSystemBoundaries(req.systemBoundaries());
        org.setComponentsDescription(req.componentsDescription());
        org.setSubserviceOrganizations(req.subserviceOrganizations());
        org.setComplementaryUserEntityControls(req.complementaryUserEntityControls());
        org.setSignificantChangesDuringPeriod(req.significantChangesDuringPeriod());

        Organization saved = organizationRepository.save(org);
        TenantContext.Principal actor = TenantContext.require();
        auditService.record(saved.getId(), actor.userId(),
                AuditEvents.COMPLIANCE_PROGRAM_UPDATED, "organization", saved.getId());
        return toResponse(saved);
    }

    /** Renders the 4 system-description fields into a plain-text document and mirrors it into Evidence. */
    @Transactional
    public void generateSystemDescriptionDocument() {
        Organization org = getCurrentOrganization();
        StringBuilder sb = new StringBuilder();
        sb.append("System Description \u2014 ").append(org.getName()).append('\n');
        sb.append("Generated ").append(java.time.Instant.now()).append("\n\n");
        sb.append("Services Provided\n").append(blank(org.getServicesProvided())).append("\n\n");
        sb.append("System Boundaries\n").append(blank(org.getSystemBoundaries())).append("\n\n");
        sb.append("Components\n").append(blank(org.getComponentsDescription())).append("\n\n");
        sb.append("Subservice Organizations\n").append(blank(org.getSubserviceOrganizations())).append("\n\n");
        sb.append("Complementary User-Entity Controls\n").append(blank(org.getComplementaryUserEntityControls())).append("\n\n");
        sb.append("Significant Changes During the Period\n").append(blank(org.getSignificantChangesDuringPeriod())).append('\n');

        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        ByteArrayMultipartFile file = new ByteArrayMultipartFile("file", "system-description.txt",
                "text/plain", bytes);
        evidenceService.upload("System Description", "Generated by the SOC 2 Kickoff Wizard", file,
                EvidenceSourceType.SYSTEM_DESCRIPTION, "kickoff-wizard");

        TenantContext.Principal actor = TenantContext.require();
        auditService.record(org.getId(), actor.userId(),
                AuditEvents.SYSTEM_DESCRIPTION_GENERATED, "organization", org.getId());
    }

    private static String blank(String s) {
        return (s == null || s.isBlank()) ? "(not yet documented)" : s;
    }

    @Transactional
    public OrganizationResponse updateAuditorInfo(UpdateAuditorInfoRequest req) {
        Organization org = getCurrentOrganization();
        org.setAuditorFirmName(blankToNull(req.auditorFirmName()));
        org.setAuditorContactName(blankToNull(req.auditorContactName()));
        org.setAuditorContactEmail(blankToNull(req.auditorContactEmail()));
        Organization saved = organizationRepository.save(org);
        TenantContext.Principal actor = TenantContext.require();
        auditService.record(saved.getId(), actor.userId(),
                AuditEvents.AUDITOR_INFO_UPDATED, "organization", saved.getId());
        return toResponse(saved);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    @Transactional
    public OrganizationResponse completeOnboarding() {
        Organization org = getCurrentOrganization();
        if (!org.isOnboardingCompleted()) {
            org.completeOnboarding();
            organizationRepository.save(org);
            TenantContext.Principal actor = TenantContext.require();
            auditService.record(org.getId(), actor.userId(),
                    AuditEvents.ONBOARDING_COMPLETED, "organization", org.getId());
        }
        return toResponse(org);
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers() {
        UUID orgId = TenantContext.require().organizationId();
        List<OrganizationMember> members = memberRepository.findByOrganizationIdOrderByCreatedAtAsc(orgId);
        if (members.isEmpty()) return List.of();
        Set<UUID> userIds = members.stream().map(OrganizationMember::getUserId).collect(java.util.stream.Collectors.toSet());
        Map<UUID, User> usersById = new HashMap<>();
        userRepository.findAllById(userIds).forEach(u -> usersById.put(u.getId(), u));
        return members.stream()
                .map(m -> {
                    User u = usersById.get(m.getUserId());
                    return new MemberResponse(
                            m.getId(),
                            m.getUserId(),
                            u == null ? null : u.getEmail(),
                            u == null ? null : u.getName(),
                            m.getRole(),
                            m.getCreatedAt(),
                            m.getAccessExpiresAt());
                })
                .toList();
    }

    @Transactional
    public MemberResponse addMember(AddMemberRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        String email = req.email().toLowerCase(Locale.ROOT).trim();

        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        boolean isNewUser = existing.isEmpty();
        User user = existing.orElseGet(() -> userRepository.save(
                // Unusable placeholder password — the invited member sets their own via the emailed link,
                // so nobody at the inviting org ever knows another employee's real password.
                new User(email, passwordEncoder.encode(UUID.randomUUID().toString()), req.name().trim())));

        if (memberRepository.existsByOrganizationIdAndUserId(orgId, user.getId())) {
            throw new ConflictException("User is already a member of the organization");
        }
        OrganizationMember membership = memberRepository.save(
                new OrganizationMember(orgId, user.getId(), req.role(), req.accessExpiresAt()));

        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.MEMBER_INVITED, "organization_member", membership.getId());

        // Resend the invite whenever this person hasn't actually completed setup yet -- not just
        // for brand-new users. Otherwise re-adding a previously-removed member (or an existing
        // user who never finished their first invite) silently sends nothing at all.
        if (isNewUser || !user.isEmailVerified()) {
            Organization org = getCurrentOrganization();
            String token = authTokenService.issue(user.getId(), TokenPurpose.INVITE, Duration.ofDays(7));
            emailService.sendInviteEmail(user.getEmail(), org.getName(), frontendUrl + "/accept-invite?token=" + token);
        }

        return new MemberResponse(membership.getId(), user.getId(), user.getEmail(), user.getName(),
                membership.getRole(), membership.getCreatedAt(), membership.getAccessExpiresAt());
    }

    @Transactional
    public MemberResponse updateMemberRole(UUID memberId, UpdateMemberRoleRequest req) {
        TenantContext.Principal actor = TenantContext.require();
        UUID orgId = actor.organizationId();
        OrganizationMember member = memberRepository.findByIdAndOrganizationId(memberId, orgId)
                .orElseThrow(() -> new NotFoundException("Member not found"));

        if (member.getRole() == Role.OWNER && req.role() != Role.OWNER) {
            long owners = memberRepository.findByOrganizationIdOrderByCreatedAtAsc(orgId).stream()
                    .filter(m -> m.getRole() == Role.OWNER)
                    .count();
            if (owners <= 1) {
                throw new ConflictException("Cannot demote the last remaining OWNER");
            }
        }
        if (member.getUserId().equals(actor.userId()) && req.role() != Role.OWNER) {
            throw new ForbiddenException("Cannot demote yourself");
        }

        member.setRole(req.role());
        OrganizationMember saved = memberRepository.save(member);

        auditService.record(orgId, actor.userId(), AuditEvents.USER_ROLE_CHANGED, "organization_member", member.getId());

        User user = userRepository.findById(member.getUserId()).orElse(null);
        return new MemberResponse(saved.getId(), saved.getUserId(),
                user == null ? null : user.getEmail(),
                user == null ? null : user.getName(),
                saved.getRole(), saved.getCreatedAt(), saved.getAccessExpiresAt());
    }

    /** Immediately ends a member's access (e.g. an auditor engagement wrapping up) -- a hard
     *  delete of the membership row, not a soft/status flag, matching the rest of this table's
     *  "permanent once added" shape everywhere else membership is read. */
    @Transactional
    public void revokeMember(UUID memberId) {
        TenantContext.Principal actor = TenantContext.require();
        UUID orgId = actor.organizationId();
        OrganizationMember member = memberRepository.findByIdAndOrganizationId(memberId, orgId)
                .orElseThrow(() -> new NotFoundException("Member not found"));
        if (member.getRole() == Role.OWNER) {
            throw new ConflictException("Cannot revoke an OWNER's access");
        }
        memberRepository.delete(member);
        auditService.record(orgId, actor.userId(), AuditEvents.AUDITOR_ACCESS_REVOKED, "organization_member", memberId);
    }

    private Organization getCurrentOrganization() {
        UUID orgId = TenantContext.require().organizationId();
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    private OrganizationResponse toResponse(Organization org) {
        List<String> scope = new ArrayList<>();
        scope.add("SECURITY");
        if (org.getTscScopeExtra() != null && !org.getTscScopeExtra().isBlank()) {
            scope.addAll(Arrays.asList(org.getTscScopeExtra().split(",")));
        }
        return new OrganizationResponse(org.getId(), org.getName(), org.getSlug(), org.getCreatedAt(),
                org.isOnboardingCompleted(), org.getOnboardingCompletedAt(),
                scope, org.getReportType(), org.getObservationPeriodStart(), org.getObservationPeriodEnd(),
                org.getTargetReportDate(), org.getServicesProvided(), org.getSystemBoundaries(),
                org.getComponentsDescription(), org.getSubserviceOrganizations(),
                org.getComplementaryUserEntityControls(), org.getSignificantChangesDuringPeriod(),
                org.getAuditorFirmName(), org.getAuditorContactName(), org.getAuditorContactEmail());
    }
}
