package com.syncpoint.compliance.ai.service;

import com.syncpoint.compliance.ai.client.AiServiceClient;
import com.syncpoint.compliance.ai.dto.AiMappingResult;
import com.syncpoint.compliance.ai.dto.AiAnalysisSummaryResponse;
import com.syncpoint.compliance.ai.entity.AiAnalysis;
import com.syncpoint.compliance.ai.repository.AiAnalysisRepository;
import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.entity.MappingType;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceVersionRepository;
import com.syncpoint.compliance.storage.ObjectStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AiAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisService.class);

    private final AiServiceClient client;
    private final AiAnalysisRepository analyses;
    private final EvidenceRepository evidenceRepo;
    private final EvidenceVersionRepository versionRepo;
    private final EvidenceControlMappingRepository mappings;
    private final ControlRepository controls;
    private final ObjectStorageService storage;
    private final AuditService audit;

    public AiAnalysisService(AiServiceClient client,
                             AiAnalysisRepository analyses,
                             EvidenceRepository evidenceRepo,
                             EvidenceVersionRepository versionRepo,
                             EvidenceControlMappingRepository mappings,
                             ControlRepository controls,
                             ObjectStorageService storage,
                             AuditService audit) {
        this.client = client;
        this.analyses = analyses;
        this.evidenceRepo = evidenceRepo;
        this.versionRepo = versionRepo;
        this.mappings = mappings;
        this.controls = controls;
        this.storage = storage;
        this.audit = audit;
    }

    @Transactional
    public AiAnalysis analyze(UUID evidenceId, UUID controlId) {
        UUID orgId = TenantContext.require().organizationId();
        Evidence e = evidenceRepo.findByIdAndOrganizationId(evidenceId, orgId)
                .orElseThrow(() -> new NotFoundException("Evidence not found"));
        Control c = controls.findById(controlId)
                .orElseThrow(() -> new NotFoundException("Control not found"));
        EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(e.getId()).orElse(null);
        byte[] payload = new byte[0];
        if (v != null) {
            try {
                payload = storage.get(v.getStorageKey());
            } catch (RuntimeException ex) {
                log.warn("could not fetch evidence payload for AI analysis (evidence={}): {}",
                        e.getId(), ex.getMessage());
            }
        }

        AiMappingResult r = client.mapEvidence(c, e, v, payload);

        AiAnalysis saved = analyses.save(new AiAnalysis(
                orgId, e.getId(), c.getId(),
                r.provider(), r.model(), r.promptVersion(),
                r.classification(), r.confidence(), r.reason(), r.raw()));

        audit.record(orgId, TenantContext.require().userId(),
                AuditEvents.AI_ANALYSIS_CREATED, "ai_analysis", saved.getId(),
                Map.of("provider", r.provider(), "model", r.model(),
                        "promptVersion", r.promptVersion(),
                        "classification", r.classification() == null ? "" : r.classification().name()));

        if (r.classification() != null) {
            mappings.save(new EvidenceControlMapping(
                    orgId, e.getId(), c.getId(),
                    MappingType.AI_SUGGESTED, r.classification(), r.confidence(), r.reason(),
                    TenantContext.require().userId()));
        }
        return saved;
    }

    /** Reasoning history for the Control Detail "AI analysis" panel, newest first. */
    @Transactional(readOnly = true)
    public List<AiAnalysisSummaryResponse> listForControl(UUID controlId) {
        UUID orgId = TenantContext.require().organizationId();
        List<AiAnalysis> list = analyses.findByControlIdAndOrganizationIdOrderByCreatedAtDesc(controlId, orgId);
        if (list.isEmpty()) return List.of();
        Map<UUID, String> names = evidenceRepo.findAllById(
                list.stream().map(AiAnalysis::getEvidenceId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Evidence::getId, Evidence::getName));
        return list.stream().map(a -> new AiAnalysisSummaryResponse(
                a.getId(), a.getEvidenceId(), names.getOrDefault(a.getEvidenceId(), "(deleted)"),
                a.getProvider(), a.getModel(), a.getPromptVersion(),
                a.getClassification(), a.getConfidence(), a.getReason(), a.getCreatedAt()))
                .toList();
    }
}
