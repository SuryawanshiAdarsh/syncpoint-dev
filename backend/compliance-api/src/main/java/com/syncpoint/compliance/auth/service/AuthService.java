package com.syncpoint.compliance.auth.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.dto.AcceptInviteRequest;
import com.syncpoint.compliance.auth.dto.ForgotPasswordRequest;
import com.syncpoint.compliance.auth.dto.LoginRequest;
import com.syncpoint.compliance.auth.dto.MeResponse;
import com.syncpoint.compliance.auth.dto.RefreshRequest;
import com.syncpoint.compliance.auth.dto.RegisterRequest;
import com.syncpoint.compliance.auth.dto.ResetPasswordRequest;
import com.syncpoint.compliance.auth.dto.TokenResponse;
import com.syncpoint.compliance.auth.dto.VerifyEmailRequest;
import com.syncpoint.compliance.auth.entity.TokenPurpose;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.ConflictException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.exception.UnauthorizedException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.notification.service.EmailService;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.entity.Role;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import com.syncpoint.compliance.platform.entity.Subscription;
import com.syncpoint.compliance.platform.entity.SubscriptionPlan;
import com.syncpoint.compliance.platform.entity.SubscriptionStatus;
import com.syncpoint.compliance.platform.repository.SubscriptionRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditService auditService;
    private final AuthTokenService authTokenService;
    private final EmailService emailService;
    private final SubscriptionRepository subscriptionRepository;
    private final String frontendUrl;

    public AuthService(UserRepository userRepository,
                       OrganizationRepository organizationRepository,
                       OrganizationMemberRepository memberRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuditService auditService,
                       AuthTokenService authTokenService,
                       EmailService emailService,
                       SubscriptionRepository subscriptionRepository,
                       @Value("${syncpoint.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.authTokenService = authTokenService;
        this.emailService = emailService;
        this.subscriptionRepository = subscriptionRepository;
        this.frontendUrl = frontendUrl;
    }

    @Transactional
    public TokenResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ConflictException("Email is already registered");
        }
        String slug = generateSlug(req.organizationName());
        Organization org = organizationRepository.save(new Organization(null, req.organizationName().trim(), slug));
        User user = userRepository.save(new User(
                req.email().toLowerCase(Locale.ROOT).trim(),
                passwordEncoder.encode(req.password()),
                req.name().trim()));
        memberRepository.save(new OrganizationMember(org.getId(), user.getId(), Role.OWNER));
        subscriptionRepository.save(new Subscription(org.getId(), SubscriptionPlan.TRIAL, SubscriptionStatus.TRIALING,
                Instant.now().plus(Duration.ofDays(14))));

        auditService.record(org.getId(), user.getId(), AuditEvents.USER_CREATED, "user", user.getId());
        auditService.record(org.getId(), user.getId(), AuditEvents.LOGIN, "user", user.getId());

        String verifyToken = authTokenService.issue(user.getId(), TokenPurpose.VERIFY, Duration.ofHours(24));
        emailService.sendVerifyEmail(user.getEmail(), frontendUrl + "/verify-email?token=" + verifyToken);

        return issueTokens(user, org.getId(), Role.OWNER);
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        OrganizationMember membership = memberRepository.findByUserIdOrderByCreatedAtAsc(user.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new UnauthorizedException("User has no organization membership"));

        auditService.record(membership.getOrganizationId(), user.getId(), AuditEvents.LOGIN, "user", user.getId());

        return issueTokens(user, membership.getOrganizationId(), membership.getRole());
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshRequest req) {
        Claims claims;
        try {
            claims = jwtService.parseRefresh(req.refreshToken());
        } catch (JwtException | IllegalArgumentException ex) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        UUID userId = UUID.fromString(claims.getSubject());
        UUID orgId = UUID.fromString(claims.get("orgId", String.class));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        OrganizationMember membership = memberRepository.findByOrganizationIdAndUserId(orgId, userId)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
        return issueTokens(user, orgId, membership.getRole());
    }

    @Transactional(readOnly = true)
    public MeResponse me() {
        TenantContext.Principal p = TenantContext.require();
        User user = userRepository.findById(p.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        Organization org = organizationRepository.findById(p.organizationId())
                .orElseThrow(() -> new NotFoundException("Organization not found"));
        return new MeResponse(user.getId(), user.getEmail(), user.getName(),
                org.getId(), org.getName(), p.role(), org.isOnboardingCompleted(), user.isEmailVerified(), user.isPlatformAdmin());
    }

    /** Always succeeds from the caller's point of view — never reveals whether the email exists. */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest req) {
        userRepository.findByEmailIgnoreCase(req.email().trim()).ifPresent(user -> {
            String token = authTokenService.issue(user.getId(), TokenPurpose.RESET, Duration.ofHours(1));
            emailService.sendPasswordResetEmail(user.getEmail(), frontendUrl + "/reset-password?token=" + token);
            firstMembership(user.getId()).ifPresent(m -> auditService.record(
                    m.getOrganizationId(), user.getId(), AuditEvents.PASSWORD_RESET_REQUESTED, "user", user.getId()));
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User user = authTokenService.consume(req.token(), TokenPurpose.RESET);
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        firstMembership(user.getId()).ifPresent(m -> auditService.record(
                m.getOrganizationId(), user.getId(), AuditEvents.PASSWORD_RESET_COMPLETED, "user", user.getId()));
    }

    /** Sets the invited member's first password and logs them straight in. */
    @Transactional
    public TokenResponse acceptInvite(AcceptInviteRequest req) {
        User user = authTokenService.consume(req.token(), TokenPurpose.INVITE);
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        user.markEmailVerified();
        userRepository.save(user);

        OrganizationMember membership = firstMembership(user.getId())
                .orElseThrow(() -> new UnauthorizedException("User has no organization membership"));
        auditService.record(membership.getOrganizationId(), user.getId(), AuditEvents.INVITE_ACCEPTED, "user", user.getId());
        auditService.record(membership.getOrganizationId(), user.getId(), AuditEvents.LOGIN, "user", user.getId());
        return issueTokens(user, membership.getOrganizationId(), membership.getRole());
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest req) {
        User user = authTokenService.consume(req.token(), TokenPurpose.VERIFY);
        user.markEmailVerified();
        userRepository.save(user);
        firstMembership(user.getId()).ifPresent(m -> auditService.record(
                m.getOrganizationId(), user.getId(), AuditEvents.EMAIL_VERIFIED, "user", user.getId()));
    }

    private Optional<OrganizationMember> firstMembership(UUID userId) {
        return memberRepository.findByUserIdOrderByCreatedAtAsc(userId).stream().findFirst();
    }

    private TokenResponse issueTokens(User user, UUID orgId, Role role) {
        String access = jwtService.createAccessToken(user.getId(), user.getEmail(), orgId, role, user.isPlatformAdmin());
        String refresh = jwtService.createRefreshToken(user.getId(), user.getEmail(), orgId, role, user.isPlatformAdmin());
        return TokenResponse.bearer(access, refresh, jwtService.accessTokenExpiresInSeconds());
    }

    private String generateSlug(String orgName) {
        String base = orgName.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isEmpty()) base = "org";
        if (base.length() > 40) base = base.substring(0, 40);
        String candidate = base;
        int attempts = 0;
        while (organizationRepository.existsBySlug(candidate)) {
            candidate = base + "-" + randomSuffix();
            if (++attempts > 5) break;
        }
        return candidate;
    }

    private static String randomSuffix() {
        byte[] bytes = new byte[3];
        RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    /** Package-private helper for tests. */
    public List<Role> rolesForUser(UUID userId) {
        return memberRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(OrganizationMember::getRole)
                .toList();
    }
}
