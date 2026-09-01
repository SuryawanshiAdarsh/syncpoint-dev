package com.syncpoint.compliance.ai.service;

import com.syncpoint.compliance.ai.client.AiAnalysisClient;
import com.syncpoint.compliance.ai.dto.AiMappingResult;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
public class AiAnalysisService {

    private final AiAnalysisClient client;
    private final AiAnalysisRepository analyses;
    private final EvidenceRepository evidenceRepo;
    private final EvidenceVersionRepository versionRepo;
    private final EvidenceControlMappingRepository mappings;
    private final ControlRepository controls;
    private final ObjectStorageService storage;
    private final AuditService audit;

    public AiAnalysisService(AiAnalysisClient client,
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
            try { payload = storage.get(v.getStorageKey()); } catch (RuntimeException ignore) { }
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
}
