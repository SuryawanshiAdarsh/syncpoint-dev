package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.dto.FrameworkResponse;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.entity.ControlOwner;
import com.syncpoint.compliance.compliance.entity.Framework;
import com.syncpoint.compliance.compliance.entity.TrustServiceCategory;
import com.syncpoint.compliance.compliance.repository.ControlOwnerRepository;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.compliance.repository.FrameworkRepository;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
import com.syncpoint.compliance.organization.entity.Organization;
import com.syncpoint.compliance.organization.repository.OrganizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ComplianceService {

    private final FrameworkRepository frameworks;
    private final ControlRepository controls;
    private final ControlStatusResolver statusResolver;
    private final ControlOwnerRepository controlOwners;
    private final OrganizationRepository organizations;
    private final UserRepository users;

    public ComplianceService(FrameworkRepository frameworks,
                             ControlRepository controls,
                             ControlStatusResolver statusResolver,
                             ControlOwnerRepository controlOwners,
                             OrganizationRepository organizations,
                             UserRepository users) {
        this.frameworks = frameworks;
        this.controls = controls;
        this.statusResolver = statusResolver;
        this.controlOwners = controlOwners;
        this.organizations = organizations;
        this.users = users;
    }

    public List<FrameworkResponse> listFrameworks() {
        return frameworks.findByActiveTrueOrderByCode().stream()
                .map(this::toFramework)
                .toList();
    }

    public FrameworkResponse getFramework(UUID id) {
        return toFramework(frameworks.findById(id)
                .orElseThrow(() -> new NotFoundException("Framework not found")));
    }

    public List<ControlResponse> listControlsForFramework(UUID frameworkId) {
        Framework fw = frameworks.findById(frameworkId)
                .orElseThrow(() -> new NotFoundException("Framework not found"));
        UUID orgId = TenantContext.require().organizationId();
        List<Control> list = controls.findByFrameworkIdAndActiveTrueOrderByCode(fw.getId());
        Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(orgId, list.stream().map(Control::getId).toList());
        Map<UUID, ControlOwner> owners = controlOwners.findByOrganizationId(orgId).stream()
                .collect(java.util.stream.Collectors.toMap(ControlOwner::getControlId, o -> o));
        Map<UUID, User> usersById = users.findAllById(owners.values().stream().map(ControlOwner::getUserId).toList())
                .stream().collect(java.util.stream.Collectors.toMap(User::getId, u -> u));
        return list.stream().map(c -> toControl(c, fw.getCode(), statuses, owners, usersById)).toList();
    }

    public List<ControlResponse> listAllControls() {
        UUID orgId = TenantContext.require().organizationId();
        Set<TrustServiceCategory> scope = scopeFor(orgId);
        List<Control> list = controls.findByActiveTrueOrderByCode().stream()
                .filter(c -> scope.contains(TrustServiceCategory.fromControlCode(c.getCode())))
                .toList();
        Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(orgId, list.stream().map(Control::getId).toList());
        Map<UUID, String> fwCode = frameworks.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(Framework::getId, Framework::getCode));
        Map<UUID, ControlOwner> owners = controlOwners.findByOrganizationId(orgId).stream()
                .collect(java.util.stream.Collectors.toMap(ControlOwner::getControlId, o -> o));
        Map<UUID, User> usersById = users.findAllById(
                owners.values().stream().map(ControlOwner::getUserId).toList()
        ).stream().collect(java.util.stream.Collectors.toMap(User::getId, u -> u));
        return list.stream().map(c -> toControl(c, fwCode.get(c.getFrameworkId()), statuses, owners, usersById)).toList();
    }

    /** Security is always in scope; the rest come from the org's saved optional TSC selections. */
    private Set<TrustServiceCategory> scopeFor(UUID orgId) {
        Set<TrustServiceCategory> scope = new HashSet<>();
        scope.add(TrustServiceCategory.SECURITY);
        Organization org = organizations.findById(orgId).orElse(null);
        if (org != null && org.getTscScopeExtra() != null && !org.getTscScopeExtra().isBlank()) {
            Arrays.stream(org.getTscScopeExtra().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty())
                    .forEach(s -> scope.add(TrustServiceCategory.valueOf(s)));
        }
        return scope;
    }

    public ControlResponse getControl(UUID id) {
        Control c = controls.findById(id).orElseThrow(() -> new NotFoundException("Control not found"));
        Framework fw = frameworks.findById(c.getFrameworkId())
                .orElseThrow(() -> new NotFoundException("Framework not found"));
        UUID orgId = TenantContext.require().organizationId();
        Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(orgId, List.of(c.getId()));
        Map<UUID, ControlOwner> owners = controlOwners.findByOrganizationIdAndControlId(orgId, c.getId())
                .map(o -> Map.of(c.getId(), o)).orElseGet(Map::of);
        Map<UUID, User> usersById = users.findAllById(owners.values().stream().map(ControlOwner::getUserId).toList())
                .stream().collect(java.util.stream.Collectors.toMap(User::getId, u -> u));
        return toControl(c, fw.getCode(), statuses, owners, usersById);
    }

    @Transactional
    public ControlResponse assignOwner(UUID controlId, UUID userId) {
        UUID orgId = TenantContext.require().organizationId();
        controls.findById(controlId).orElseThrow(() -> new NotFoundException("Control not found"));
        ControlOwner owner = controlOwners.findByOrganizationIdAndControlId(orgId, controlId).orElse(null);
        if (userId == null) {
            if (owner != null) controlOwners.delete(owner);
        } else if (owner == null) {
            controlOwners.save(new ControlOwner(orgId, controlId, userId));
        } else {
            owner.setUserId(userId);
            controlOwners.save(owner);
        }
        return getControl(controlId);
    }

    private FrameworkResponse toFramework(Framework f) {
        return new FrameworkResponse(f.getId(), f.getCode(), f.getName(), f.getVersion(), f.isActive());
    }

    private ControlResponse toControl(Control c, String frameworkCode, Map<UUID, ControlStatus> statuses,
                                      Map<UUID, ControlOwner> owners, Map<UUID, User> usersById) {
        ControlOwner owner = owners.get(c.getId());
        User ownerUser = owner == null ? null : usersById.get(owner.getUserId());
        return new ControlResponse(c.getId(), c.getFrameworkId(), frameworkCode,
                c.getCode(), c.getTitle(), c.getDescription(), c.getCategory(),
                statuses.getOrDefault(c.getId(), ControlStatus.MISSING),
                owner == null ? null : owner.getUserId(),
                ownerUser == null ? null : ownerUser.getName());
    }
}
