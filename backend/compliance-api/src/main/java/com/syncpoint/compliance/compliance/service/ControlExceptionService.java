package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlExceptionResponse;
import com.syncpoint.compliance.compliance.dto.CreateControlExceptionRequest;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.entity.ControlException;
import com.syncpoint.compliance.compliance.repository.ControlExceptionRepository;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/** CC-series exception/deviation log: proof a control failed partway through the observation
 *  period and was (or wasn't yet) remediated -- distinct from evidence-coverage presence/absence. */
@Service
@Transactional(readOnly = true)
public class ControlExceptionService {

    private final ControlExceptionRepository exceptions;
    private final ControlRepository controls;
    private final UserRepository users;
    private final AuditService auditService;

    public ControlExceptionService(ControlExceptionRepository exceptions, ControlRepository controls,
                                    UserRepository users, AuditService auditService) {
        this.exceptions = exceptions;
        this.controls = controls;
        this.users = users;
        this.auditService = auditService;
    }

    public List<ControlExceptionResponse> listForControl(UUID controlId) {
        UUID orgId = TenantContext.require().organizationId();
        Control control = controls.findById(controlId).orElseThrow(() -> new NotFoundException("Control not found"));
        List<ControlException> list = exceptions.findByControlIdAndOrganizationIdOrderByDetectedDateDesc(controlId, orgId);
        return toResponses(list, Map.of(control.getId(), control));
    }

    /** Used by the Readiness Report to summarize exceptions across every control in scope. */
    public List<ControlExceptionResponse> listForOrganization() {
        UUID orgId = TenantContext.require().organizationId();
        List<ControlException> list = exceptions.findByOrganizationIdOrderByDetectedDateDesc(orgId);
        Map<UUID, Control> controlsById = controls.findAllById(
                list.stream().map(ControlException::getControlId).distinct().toList()
        ).stream().collect(Collectors.toMap(Control::getId, c -> c));
        return toResponses(list, controlsById);
    }

    @Transactional
    public ControlExceptionResponse create(UUID controlId, CreateControlExceptionRequest req) {
        UUID orgId = TenantContext.require().organizationId();
        controls.findById(controlId).orElseThrow(() -> new NotFoundException("Control not found"));
        UUID actorId = TenantContext.require().userId();
        ControlException entity = new ControlException(orgId, controlId, req.description(), req.detectedDate(), actorId);
        exceptions.save(entity);
        auditService.record(orgId, actorId, AuditEvents.CONTROL_EXCEPTION_LOGGED, "control_exception", entity.getId());
        return toResponse(entity, controls.findById(controlId).orElse(null), actorId);
    }

    @Transactional
    public ControlExceptionResponse remediate(UUID controlId, UUID exceptionId, LocalDate remediatedDate) {
        UUID orgId = TenantContext.require().organizationId();
        ControlException entity = exceptions.findByIdAndOrganizationId(exceptionId, orgId)
                .orElseThrow(() -> new NotFoundException("Exception not found"));
        entity.remediate(remediatedDate);
        exceptions.save(entity);
        UUID actorId = TenantContext.require().userId();
        auditService.record(orgId, actorId, AuditEvents.CONTROL_EXCEPTION_REMEDIATED, "control_exception", entity.getId());
        return toResponse(entity, controls.findById(controlId).orElse(null), entity.getCreatedBy());
    }

    @Transactional
    public void delete(UUID controlId, UUID exceptionId) {
        UUID orgId = TenantContext.require().organizationId();
        ControlException entity = exceptions.findByIdAndOrganizationId(exceptionId, orgId)
                .orElseThrow(() -> new NotFoundException("Exception not found"));
        exceptions.delete(entity);
    }

    private List<ControlExceptionResponse> toResponses(List<ControlException> list, Map<UUID, Control> controlsById) {
        Map<UUID, User> usersById = users.findAllById(
                list.stream().map(ControlException::getCreatedBy).filter(java.util.Objects::nonNull).distinct().toList()
        ).stream().collect(Collectors.toMap(User::getId, u -> u));
        return list.stream()
                .sorted(Comparator.comparing(ControlException::getDetectedDate).reversed())
                .map(e -> toResponse(e, controlsById.get(e.getControlId()),
                        e.getCreatedBy(), usersById))
                .toList();
    }

    private ControlExceptionResponse toResponse(ControlException e, Control control, UUID createdBy) {
        User user = createdBy == null ? null : users.findById(createdBy).orElse(null);
        return toResponse(e, control, createdBy, user == null ? Map.of() : Map.of(user.getId(), user));
    }

    private ControlExceptionResponse toResponse(ControlException e, Control control, UUID createdBy, Map<UUID, User> usersById) {
        User user = createdBy == null ? null : usersById.get(createdBy);
        return new ControlExceptionResponse(
                e.getId(), e.getControlId(), control == null ? null : control.getCode(),
                e.getDescription(), e.getDetectedDate(), e.getRemediatedDate(), e.getStatus(),
                user == null ? null : user.getName(), e.getCreatedAt());
    }
}
