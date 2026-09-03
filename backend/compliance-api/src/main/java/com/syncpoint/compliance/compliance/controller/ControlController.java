package com.syncpoint.compliance.compliance.controller;

import com.syncpoint.compliance.ai.dto.AiAnalysisSummaryResponse;
import com.syncpoint.compliance.ai.service.AiAnalysisService;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.dto.ControlResponse;
import com.syncpoint.compliance.compliance.service.ComplianceService;
import com.syncpoint.compliance.evidence.dto.ControlMappingResponse;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.service.EvidenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/controls")
public class ControlController {

    private final ComplianceService complianceService;
    private final EvidenceControlMappingRepository mappings;
    private final EvidenceService evidenceService;
    private final AiAnalysisService aiAnalysisService;

    public ControlController(ComplianceService complianceService,
                             EvidenceControlMappingRepository mappings,
                             EvidenceService evidenceService,
                             AiAnalysisService aiAnalysisService) {
        this.complianceService = complianceService;
        this.mappings = mappings;
        this.evidenceService = evidenceService;
        this.aiAnalysisService = aiAnalysisService;
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

    /** Mapping + evidence summary joined — feeds the Control Detail "mapped evidence" table and its Confirm/Reject actions. */
    @GetMapping("/{id}/mappings")
    public ResponseEntity<List<ControlMappingResponse>> mappings(@PathVariable UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        List<EvidenceControlMapping> rows = mappings.findByControlIdAndOrganizationId(id, orgId);
        if (rows.isEmpty()) return ResponseEntity.ok(List.of());

        Map<UUID, EvidenceResponse> evidenceById = evidenceService.list().stream()
                .collect(Collectors.toMap(EvidenceResponse::id, e -> e));

        List<ControlMappingResponse> out = rows.stream()
                .map(m -> {
                    EvidenceResponse ev = evidenceById.get(m.getEvidenceId());
                    return new ControlMappingResponse(
                            m.getId(), m.getEvidenceId(),
                            ev == null ? "(deleted evidence)" : ev.name(),
                            ev == null ? null : ev.sourceType(),
                            ev == null ? null : ev.sourceSystem(),
                            ev == null ? null : ev.status(),
                            ev == null ? null : ev.freshness(),
                            ev == null ? null : ev.collectedAt(),
                            m.getMappingType(), m.getClassification(), m.getConfidence(), m.getReason(),
                            m.getCreatedAt());
                })
                .sorted(Comparator.comparing(ControlMappingResponse::mappedAt).reversed())
                .toList();

        return ResponseEntity.ok(out);
    }

    /** Latest AI reasoning per evidence for this control — feeds the Control Detail "AI analysis" panel. */
    @GetMapping("/{id}/ai-analyses")
    public ResponseEntity<List<AiAnalysisSummaryResponse>> aiAnalyses(@PathVariable UUID id) {
        return ResponseEntity.ok(aiAnalysisService.listForControl(id));
    }
}
