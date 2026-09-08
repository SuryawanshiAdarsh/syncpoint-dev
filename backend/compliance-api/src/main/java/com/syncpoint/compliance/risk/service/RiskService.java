package com.syncpoint.compliance.risk.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.risk.dto.CreateRiskRequest;
import com.syncpoint.compliance.risk.dto.RiskResponse;
import com.syncpoint.compliance.risk.dto.UpdateRiskRequest;
import com.syncpoint.compliance.risk.entity.Risk;
import com.syncpoint.compliance.risk.entity.RiskCategory;
import com.syncpoint.compliance.risk.entity.RiskControlLink;
import com.syncpoint.compliance.risk.entity.RiskLevel;
import com.syncpoint.compliance.risk.entity.RiskStatus;
import com.syncpoint.compliance.risk.repository.RiskControlLinkRepository;
import com.syncpoint.compliance.risk.repository.RiskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** CC3-series risk assessment: risk identification, scoring, and mapping to mitigating controls. */
@Service
@Transactional(readOnly = true)
public class RiskService {

    private final RiskRepository risks;
    private final RiskControlLinkRepository links;
    private final ControlRepository controls;
    private final UserRepository users;
    private final AuditService auditService;

    public RiskService(RiskRepository risks, RiskControlLinkRepository links, ControlRepository controls,
                        UserRepository users, AuditService auditService) {
        this.risks = risks;
        this.links = links;
        this.controls = controls;
        this.users = users;
        this.auditService = auditService;
    }

    public List<RiskResponse> list() {
        UUID orgId = TenantContext.require().organizationId();
        List<Risk> list = risks.findByOrganizationIdOrderByCreatedAtDesc(orgId);
        Map<UUID, List<RiskControlLink>> linksByRisk = links.findByOrganizationId(orgId).stream()
                .collect(Collectors.groupingBy(RiskControlLink::getRiskId));
        Map<UUID, Control> controlsById = controls.findAllById(
                linksByRisk.values().stream().flatMap(List::stream).map(RiskControlLink::getControlId).toList()
        ).stream().collect(Collectors.toMap(Control::getId, c -> c));
        Map<UUID, User> usersById = users.findAllById(
                list.stream().map(Risk::getOwnerUserId).filter(java.util.Objects::nonNull).toList()
        ).stream().collect(Collectors.toMap(User::getId, u -> u));
        return list.stream().map(r -> toResponse(r, linksByRisk.getOrDefault(r.getId(), List.of()), controlsById, usersById)).toList();
    }

    public RiskResponse get(UUID id) {
        return getOne(id);
    }

    @Transactional
    public RiskResponse create(CreateRiskRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        Risk risk = new Risk(orgId, req.title(), req.description(),
                RiskCategory.valueOf(req.category()), RiskLevel.valueOf(req.likelihood()), RiskLevel.valueOf(req.impact()),
                req.ownerUserId(), req.nextReviewDate());
        risk = risks.save(risk);
        replaceLinks(orgId, risk.getId(), req.controlIds());
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.RISK_CREATED, "risk", risk.getId());
        return getOne(risk.getId());
    }

    @Transactional
    public RiskResponse update(UUID id, UpdateRiskRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        Risk risk = risks.findByIdAndOrganizationId(id, orgId).orElseThrow(() -> new NotFoundException("Risk not found"));
        risk.setTitle(req.title());
        risk.setDescription(req.description());
        risk.setCategory(RiskCategory.valueOf(req.category()));
        risk.setLikelihood(RiskLevel.valueOf(req.likelihood()));
        risk.setImpact(RiskLevel.valueOf(req.impact()));
        risk.setOwnerUserId(req.ownerUserId());
        risk.setNextReviewDate(req.nextReviewDate());
        risks.save(risk);
        replaceLinks(orgId, risk.getId(), req.controlIds());
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.RISK_UPDATED, "risk", risk.getId());
        return getOne(risk.getId());
    }

    @Transactional
    public RiskResponse updateStatus(UUID id, String status) {
        UUID orgId = TenantContext.require().organizationId();
        Risk risk = risks.findByIdAndOrganizationId(id, orgId).orElseThrow(() -> new NotFoundException("Risk not found"));
        risk.setStatus(RiskStatus.valueOf(status));
        risks.save(risk);
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.RISK_STATUS_CHANGED, "risk", risk.getId());
        return getOne(risk.getId());
    }

    @Transactional
    public RiskResponse assignOwner(UUID id, UUID userId) {
        UUID orgId = TenantContext.require().organizationId();
        Risk risk = risks.findByIdAndOrganizationId(id, orgId).orElseThrow(() -> new NotFoundException("Risk not found"));
        risk.setOwnerUserId(userId);
        risks.save(risk);
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.RISK_OWNER_ASSIGNED, "risk", risk.getId());
        return getOne(risk.getId());
    }

    @Transactional
    public void delete(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        Risk risk = risks.findByIdAndOrganizationId(id, orgId).orElseThrow(() -> new NotFoundException("Risk not found"));
        links.deleteByRiskIdAndOrganizationId(risk.getId(), orgId);
        risks.delete(risk);
        auditService.record(orgId, TenantContext.require().userId(), AuditEvents.RISK_DELETED, "risk", id);
    }

    private void replaceLinks(UUID orgId, UUID riskId, List<UUID> controlIds) {
        links.deleteByRiskIdAndOrganizationId(riskId, orgId);
        if (controlIds == null || controlIds.isEmpty()) return;
        controlIds.stream().distinct()
                .forEach(controlId -> links.save(new RiskControlLink(orgId, riskId, controlId)));
    }

    private RiskResponse getOne(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        Risk risk = risks.findByIdAndOrganizationId(id, orgId).orElseThrow(() -> new NotFoundException("Risk not found"));
        List<RiskControlLink> riskLinks = links.findByRiskIdAndOrganizationId(id, orgId);
        Map<UUID, Control> controlsById = controls.findAllById(riskLinks.stream().map(RiskControlLink::getControlId).toList())
                .stream().collect(Collectors.toMap(Control::getId, c -> c));
        Map<UUID, User> usersById = risk.getOwnerUserId() == null ? Map.of()
                : users.findById(risk.getOwnerUserId()).map(u -> Map.of(u.getId(), u)).orElseGet(Map::of);
        return toResponse(risk, riskLinks, controlsById, usersById);
    }

    private RiskResponse toResponse(Risk r, List<RiskControlLink> riskLinks, Map<UUID, Control> controlsById, Map<UUID, User> usersById) {
        User owner = r.getOwnerUserId() == null ? null : usersById.get(r.getOwnerUserId());
        List<Control> linkedControls = riskLinks.stream()
                .map(l -> controlsById.get(l.getControlId()))
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(Control::getCode))
                .toList();
        return new RiskResponse(
                r.getId(), r.getTitle(), r.getDescription(), r.getCategory(), r.getLikelihood(), r.getImpact(),
                r.score(), r.getStatus(), r.getOwnerUserId(), owner == null ? null : owner.getName(),
                r.getNextReviewDate(),
                linkedControls.stream().map(Control::getId).toList(),
                linkedControls.stream().map(Control::getCode).toList(),
                r.getCreatedAt(), r.getUpdatedAt());
    }
}
