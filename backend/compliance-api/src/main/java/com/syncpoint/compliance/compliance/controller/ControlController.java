package com.syncpoint.compliance.compliance.controller;

import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.service.ComplianceService;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/controls")
public class ControlController {

    private final ComplianceService complianceService;
    private final EvidenceControlMappingRepository mappings;
    private final EvidenceService evidenceService;

    public ControlController(ComplianceService complianceService,
                             EvidenceControlMappingRepository mappings,
                             EvidenceService evidenceService) {
        this.complianceService = complianceService;
        this.mappings = mappings;
        this.evidenceService = evidenceService;
    }

    @GetMapping
    public ResponseEntity<List<ControlResponse>> list() {
        return ResponseEntity.ok(complianceService.listAllControls());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ControlResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(complianceService.getControl(id));
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<List<EvidenceResponse>> evidence(@PathVariable UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        List<UUID> evidenceIds = mappings.findByControlIdAndOrganizationId(id, orgId).stream()
                .map(EvidenceControlMapping::getEvidenceId)
                .collect(Collectors.toSet())
                .stream().toList();
        List<EvidenceResponse> all = evidenceService.list();
        return ResponseEntity.ok(all.stream()
                .filter(e -> evidenceIds.contains(e.id()))
                .toList());
    }
}
