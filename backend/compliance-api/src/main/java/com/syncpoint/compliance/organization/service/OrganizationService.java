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
import com.syncpoint.compliance.notification.service.EmailService;
import com.syncpoint.compliance.organization.dto.AddMemberRequest;
import com.syncpoint.compliance.organization.dto.MemberResponse;
import com.syncpoint.compliance.organization.dto.OrganizationResponse;
import com.syncpoint.compliance.organization.dto.UpdateMemberRoleRequest;
import com.syncpoint.compliance.organization.dto.UpdateOrganizationRequest;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.entity.Role;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
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
    private final String frontendUrl;

    public OrganizationService(OrganizationRepository organizationRepository,
                               OrganizationMemberRepository memberRepository,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuditService auditService,
                               AuthTokenService authTokenService,
                               EmailService emailService,
                               @Value("${syncpoint.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.authTokenService = authTokenService;
        this.emailService = emailService;
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
                            m.getCreatedAt());
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
        OrganizationMember membership = memberRepository.save(new OrganizationMember(orgId, user.getId(), req.role()));

        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.MEMBER_INVITED, "organization_member", membership.getId());

        if (isNewUser) {
            Organization org = getCurrentOrganization();
            String token = authTokenService.issue(user.getId(), TokenPurpose.INVITE, Duration.ofDays(7));
            emailService.sendInviteEmail(user.getEmail(), org.getName(), frontendUrl + "/accept-invite?token=" + token);
        }

        return new MemberResponse(membership.getId(), user.getId(), user.getEmail(), user.getName(),
                membership.getRole(), membership.getCreatedAt());
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
                saved.getRole(), saved.getCreatedAt());
    }

    private Organization getCurrentOrganization() {
        UUID orgId = TenantContext.require().organizationId();
        return organizationRepository.findById(orgId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
    }

    private OrganizationResponse toResponse(Organization org) {
        return new OrganizationResponse(org.getId(), org.getName(), org.getSlug(), org.getCreatedAt(),
                org.isOnboardingCompleted(), org.getOnboardingCompletedAt());
    }
}
