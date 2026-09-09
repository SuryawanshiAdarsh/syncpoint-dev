package com.syncpoint.compliance.auditor.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.auditor.dto.AuditorControlReviewResponse;
import com.syncpoint.compliance.auditor.dto.AuditorOverviewResponse;
import com.syncpoint.compliance.auditor.dto.AuditorRequestResponse;
import com.syncpoint.compliance.auditor.dto.CreateAuditorRequestRequest;
import com.syncpoint.compliance.auditor.dto.MarkControlReviewedRequest;
import com.syncpoint.compliance.auditor.dto.ResolveAuditorRequestRequest;
import com.syncpoint.compliance.auditor.entity.AuditorControlReview;
import com.syncpoint.compliance.auditor.entity.AuditorRequest;
import com.syncpoint.compliance.auditor.entity.AuditorRequestStatus;
import com.syncpoint.compliance.auditor.repository.AuditorControlReviewRepository;
import com.syncpoint.compliance.auditor.repository.AuditorRequestRepository;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.compliance.service.ComplianceService;
import com.syncpoint.compliance.compliance.service.ControlExceptionService;
import com.syncpoint.compliance.compliance.dto.ControlExceptionResponse;
import com.syncpoint.compliance.compliance.service.ReadinessReportService;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceVersionRepository;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import com.syncpoint.compliance.notification.service.EmailService;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.entity.Role;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import com.syncpoint.compliance.policy.dto.PolicyResponse;
import com.syncpoint.compliance.policy.entity.PolicyStatus;
import com.syncpoint.compliance.policy.service.PolicyService;
import com.syncpoint.compliance.risk.dto.RiskResponse;
import com.syncpoint.compliance.risk.service.RiskReportService;
import com.syncpoint.compliance.risk.service.RiskService;
import com.syncpoint.compliance.storage.ObjectStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Everything the auditor workspace (/api/v1/auditor/**) needs. Deliberately thin for every
 * read-only surface — it delegates to the SAME services the internal app uses
 * (ComplianceService, RiskService, ControlExceptionService, PolicyService,
 * ReadinessReportService), since TenantContext resolves identically for any authenticated org
 * member regardless of role. Only the request/review interaction loop is genuinely new logic.
 */
@Service
@Transactional(readOnly = true)
public class AuditorService {

    private final OrganizationRepository organizations;
    private final OrganizationMemberRepository members;
    private final ComplianceService complianceService;
    private final EvidenceControlMappingRepository mappingRepo;
    private final EvidenceService evidenceService;
    private final EvidenceRepository evidenceRepo;
    private final EvidenceVersionRepository versionRepo;
    private final ObjectStorageService storage;
    private final RiskService riskService;
    private final ControlExceptionService controlExceptionService;
    private final PolicyService policyService;
    private final ReadinessReportService readinessReportService;
    private final RiskReportService riskReportService;
    private final ControlRepository controlRepo;
    private final UserRepository userRepo;
    private final AuditorRequestRepository requestRepo;
    private final AuditorControlReviewRepository reviewRepo;
    private final AuditService auditService;
    private final EmailService emailService;
    private final String frontendUrl;

    public AuditorService(OrganizationRepository organizations,
                          OrganizationMemberRepository members,
                          ComplianceService complianceService,
                          EvidenceControlMappingRepository mappingRepo,
                          EvidenceService evidenceService,
                          EvidenceRepository evidenceRepo,
                          EvidenceVersionRepository versionRepo,
                          ObjectStorageService storage,
                          RiskService riskService,
                          ControlExceptionService controlExceptionService,
                          PolicyService policyService,
                          ReadinessReportService readinessReportService,
                          RiskReportService riskReportService,
                          ControlRepository controlRepo,
                          UserRepository userRepo,
                          AuditorRequestRepository requestRepo,
                          AuditorControlReviewRepository reviewRepo,
                          AuditService auditService,
                          EmailService emailService,
                          @Value("${syncpoint.frontend-url:http://localhost:4200}") String frontendUrl) {
        this.organizations = organizations;
        this.members = members;
        this.complianceService = complianceService;
        this.mappingRepo = mappingRepo;
        this.evidenceService = evidenceService;
        this.evidenceRepo = evidenceRepo;
        this.versionRepo = versionRepo;
        this.storage = storage;
        this.riskService = riskService;
        this.controlExceptionService = controlExceptionService;
        this.policyService = policyService;
        this.readinessReportService = readinessReportService;
        this.riskReportService = riskReportService;
        this.controlRepo = controlRepo;
        this.userRepo = userRepo;
        this.requestRepo = requestRepo;
        this.reviewRepo = reviewRepo;
        this.auditService = auditService;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
    }

    public AuditorOverviewResponse overview() {
        UUID orgId = TenantContext.require().organizationId();
        Organization org = organizations.findById(orgId).orElseThrow(() -> new NotFoundException("Organization not found"));
        List<ControlResponse> controls = complianceService.listAllControls();
        long covered = controls.stream().filter(c -> c.status() == ControlStatus.COVERED).count();
        int percent = controls.isEmpty() ? 0 : (int) Math.round((covered * 100.0) / controls.size());
        int openRequests = requestRepo.findByOrganizationIdAndStatusOrderByCreatedAtDesc(orgId, AuditorRequestStatus.OPEN).size();
        return new AuditorOverviewResponse(org.getName(), org.getAuditorFirmName(), org.getReportType(),
                org.getObservationPeriodStart(), org.getObservationPeriodEnd(), org.getTargetReportDate(),
                controls.size(), (int) covered, percent, openRequests);
    }

    public List<ControlResponse> controls() {
        return complianceService.listAllControls();
    }

    public ControlResponse control(UUID id) {
        return complianceService.getControl(id);
    }

    /** Mirrors ControlController.evidence(id) exactly — same read path, no auditor-specific logic. */
    public List<EvidenceResponse> controlEvidence(UUID controlId) {
        UUID orgId = TenantContext.require().organizationId();
        List<UUID> evidenceIds = mappingRepo.findByControlIdAndOrganizationId(controlId, orgId).stream()
                .map(EvidenceControlMapping::getEvidenceId)
                .collect(Collectors.toSet())
                .stream().toList();
        List<EvidenceResponse> all = evidenceService.list();
        return all.stream().filter(e -> evidenceIds.contains(e.id())).toList();
    }

    public DocumentContent evidenceDocument(UUID evidenceId) {
        UUID orgId = TenantContext.require().organizationId();
        Evidence evidence = evidenceRepo.findByIdAndOrganizationId(evidenceId, orgId)
                .orElseThrow(() -> new NotFoundException("Evidence not found"));
        EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(evidenceId)
                .orElseThrow(() -> new NotFoundException("Evidence has no file"));
        byte[] bytes = storage.get(v.getStorageKey());
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.AUDITOR_REPORT_DOWNLOADED, "evidence", evidenceId);
        return new DocumentContent(bytes, v.getMimeType() == null ? "application/octet-stream" : v.getMimeType(), evidence.getName());
    }

    public List<RiskResponse> riskRegister() {
        return riskService.list();
    }

    public byte[] riskAssessmentReport() {
        return riskReportService.generate();
    }

    public List<ControlExceptionResponse> controlExceptions() {
        return controlExceptionService.listForOrganization();
    }

    public List<PolicyResponse> policies() {
        return policyService.list().stream().filter(p -> p.status() == PolicyStatus.PUBLISHED).toList();
    }

    public byte[] readinessReport() {
        UUID orgId = TenantContext.require().organizationId();
        byte[] bytes = readinessReportService.generate();
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.AUDITOR_REPORT_DOWNLOADED, "organization", orgId);
        return bytes;
    }

    @Transactional
    public AuditorRequestResponse createRequest(UUID controlId, CreateAuditorRequestRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        UUID actorId = TenantContext.require().userId();
        Control control = controlRepo.findById(controlId).orElseThrow(() -> new NotFoundException("Control not found"));
        AuditorRequest entity = new AuditorRequest(orgId, controlId, req.type(), req.message().trim(), actorId);
        AuditorRequest saved = requestRepo.save(entity);
        auditService.record(orgId, actorId, AuditEvents.AUDITOR_REQUEST_CREATED, "auditor_request", saved.getId());
        notifyOrgOfNewRequest(orgId, control, saved);
        User creator = userRepo.findById(actorId).orElse(null);
        return toResponse(saved, control, creator == null ? Map.of() : Map.of(actorId, creator));
    }

    public List<AuditorRequestResponse> listMyRequests() {
        UUID orgId = TenantContext.require().organizationId();
        UUID actorId = TenantContext.require().userId();
        List<AuditorRequest> mine = requestRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .filter(r -> r.getCreatedBy().equals(actorId))
                .toList();
        return enrich(mine);
    }

    /** Org-side inbox — any OWNER/ADMIN/REVIEWER sees every auditor's requests, not just their own. */
    public List<AuditorRequestResponse> listRequestsForOrganization() {
        UUID orgId = TenantContext.require().organizationId();
        return enrich(requestRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId));
    }

    /** Feeds the org-side Control Detail page's auditor activity panel. */
    public List<AuditorRequestResponse> listRequestsForControl(UUID controlId) {
        UUID orgId = TenantContext.require().organizationId();
        return enrich(requestRepo.findByControlIdAndOrganizationIdOrderByCreatedAtDesc(controlId, orgId));
    }

    @Transactional
    public AuditorRequestResponse resolveRequest(UUID requestId, ResolveAuditorRequestRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        UUID actorId = TenantContext.require().userId();
        AuditorRequest entity = requestRepo.findByIdAndOrganizationId(requestId, orgId)
                .orElseThrow(() -> new NotFoundException("Request not found"));
        entity.resolve(actorId, req.resolutionNote() == null ? null : req.resolutionNote().trim());
        AuditorRequest saved = requestRepo.save(entity);
        auditService.record(orgId, actorId, AuditEvents.AUDITOR_REQUEST_RESOLVED, "auditor_request", saved.getId());
        Control control = controlRepo.findById(saved.getControlId()).orElse(null);
        Map<UUID, User> usersById = userRepo.findAllById(
                java.util.stream.Stream.of(saved.getCreatedBy(), saved.getResolvedBy()).filter(java.util.Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(User::getId, u -> u));
        return toResponse(saved, control, usersById);
    }

    @Transactional
    public AuditorControlReviewResponse markReviewed(UUID controlId, MarkControlReviewedRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        UUID actorId = TenantContext.require().userId();
        Control control = controlRepo.findById(controlId).orElseThrow(() -> new NotFoundException("Control not found"));
        AuditorControlReview entity = new AuditorControlReview(orgId, controlId, actorId,
                req.note() == null ? null : req.note().trim());
        AuditorControlReview saved = reviewRepo.save(entity);
        auditService.record(orgId, actorId, AuditEvents.AUDITOR_CONTROL_REVIEWED, "auditor_control_review", saved.getId());
        User user = userRepo.findById(actorId).orElse(null);
        return new AuditorControlReviewResponse(saved.getId(), controlId, control.getCode(),
                user == null ? null : user.getName(), saved.getReviewedAt(), saved.getNote());
    }

    public List<AuditorControlReviewResponse> controlReviews(UUID controlId) {
        UUID orgId = TenantContext.require().organizationId();
        List<AuditorControlReview> list = reviewRepo.findByControlIdAndOrganizationIdOrderByReviewedAtDesc(controlId, orgId);
        if (list.isEmpty()) return List.of();
        Control control = controlRepo.findById(controlId).orElse(null);
        Map<UUID, User> usersById = userRepo.findAllById(list.stream().map(AuditorControlReview::getReviewedBy).distinct().toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        return list.stream()
                .map(r -> new AuditorControlReviewResponse(r.getId(), controlId, control == null ? null : control.getCode(),
                        usersById.containsKey(r.getReviewedBy()) ? usersById.get(r.getReviewedBy()).getName() : null,
                        r.getReviewedAt(), r.getNote()))
                .toList();
    }

    private void notifyOrgOfNewRequest(UUID orgId, Control control, AuditorRequest entity) {
        List<OrganizationMember> managers = members.findByOrganizationIdOrderByCreatedAtAsc(orgId).stream()
                .filter(m -> m.getRole() == Role.OWNER || m.getRole() == Role.ADMIN)
                .toList();
        if (managers.isEmpty()) return;
        Map<UUID, User> usersById = userRepo.findAllById(managers.stream().map(OrganizationMember::getUserId).toList())
                .stream().collect(Collectors.toMap(User::getId, u -> u));
        String link = frontendUrl + "/settings";
        for (OrganizationMember m : managers) {
            User u = usersById.get(m.getUserId());
            if (u != null) {
                emailService.sendAuditorRequestEmail(u.getEmail(), control.getCode(), entity.getMessage(), link);
            }
        }
    }

    private List<AuditorRequestResponse> enrich(List<AuditorRequest> list) {
        if (list.isEmpty()) return List.of();
        Map<UUID, Control> controlsById = controlRepo.findAllById(
                list.stream().map(AuditorRequest::getControlId).distinct().toList()
        ).stream().collect(Collectors.toMap(Control::getId, c -> c));
        java.util.Set<UUID> userIds = new java.util.HashSet<>();
        list.forEach(r -> { userIds.add(r.getCreatedBy()); if (r.getResolvedBy() != null) userIds.add(r.getResolvedBy()); });
        Map<UUID, User> usersById = userRepo.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));
        return list.stream()
                .sorted(Comparator.comparing(AuditorRequest::getCreatedAt).reversed())
                .map(r -> toResponse(r, controlsById.get(r.getControlId()), usersById))
                .toList();
    }

    private AuditorRequestResponse toResponse(AuditorRequest r, Control control, Map<UUID, User> usersById) {
        User creator = usersById.get(r.getCreatedBy());
        User resolver = r.getResolvedBy() == null ? null : usersById.get(r.getResolvedBy());
        return new AuditorRequestResponse(r.getId(), r.getControlId(),
                control == null ? null : control.getCode(), control == null ? null : control.getTitle(),
                r.getType(), r.getMessage(), r.getStatus(),
                creator == null ? null : creator.getName(), r.getCreatedAt(),
                resolver == null ? null : resolver.getName(), r.getResolvedAt(), r.getResolutionNote());
    }

    public record DocumentContent(byte[] bytes, String mimeType, String filename) {
    }
}
