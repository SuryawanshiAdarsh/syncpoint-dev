package com.syncpoint.compliance.compliance.service;

import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.dto.ControlStatus;
import com.syncpoint.compliance.compliance.dto.FrameworkResponse;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.entity.Framework;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.compliance.repository.FrameworkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ComplianceService {

    private final FrameworkRepository frameworks;
    private final ControlRepository controls;
    private final ControlStatusResolver statusResolver;

    public ComplianceService(FrameworkRepository frameworks,
                             ControlRepository controls,
                             ControlStatusResolver statusResolver) {
        this.frameworks = frameworks;
        this.controls = controls;
        this.statusResolver = statusResolver;
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
        List<Control> list = controls.findByFrameworkIdAndActiveTrueOrderByCode(fw.getId());
        Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(
                TenantContext.require().organizationId(),
                list.stream().map(Control::getId).toList());
        return list.stream().map(c -> toControl(c, fw.getCode(), statuses)).toList();
    }

    public List<ControlResponse> listAllControls() {
        List<Control> list = controls.findByActiveTrueOrderByCode();
        Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(
                TenantContext.require().organizationId(),
                list.stream().map(Control::getId).toList());
        Map<UUID, String> fwCode = frameworks.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(Framework::getId, Framework::getCode));
        return list.stream().map(c -> toControl(c, fwCode.get(c.getFrameworkId()), statuses)).toList();
    }

    public ControlResponse getControl(UUID id) {
        Control c = controls.findById(id).orElseThrow(() -> new NotFoundException("Control not found"));
        Framework fw = frameworks.findById(c.getFrameworkId())
                .orElseThrow(() -> new NotFoundException("Framework not found"));
        Map<UUID, ControlStatus> statuses = statusResolver.statusesFor(
                TenantContext.require().organizationId(), List.of(c.getId()));
        return toControl(c, fw.getCode(), statuses);
    }

    private FrameworkResponse toFramework(Framework f) {
        return new FrameworkResponse(f.getId(), f.getCode(), f.getName(), f.getVersion(), f.isActive());
    }

    private ControlResponse toControl(Control c, String frameworkCode, Map<UUID, ControlStatus> statuses) {
        return new ControlResponse(c.getId(), c.getFrameworkId(), frameworkCode,
                c.getCode(), c.getTitle(), c.getDescription(), c.getCategory(),
                statuses.getOrDefault(c.getId(), ControlStatus.MISSING));
    }
}
