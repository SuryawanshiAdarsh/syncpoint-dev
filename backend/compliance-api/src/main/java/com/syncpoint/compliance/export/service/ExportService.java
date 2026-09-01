package com.syncpoint.compliance.export.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceVersionRepository;
import com.syncpoint.compliance.export.dto.ExportJobResponse;
import com.syncpoint.compliance.export.entity.ExportJob;
import com.syncpoint.compliance.export.entity.ExportJobStatus;
import com.syncpoint.compliance.export.repository.ExportJobRepository;
import com.syncpoint.compliance.storage.ObjectStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class ExportService {

    private static final Logger log = LoggerFactory.getLogger(ExportService.class);

    private final ExportJobRepository jobs;
    private final EvidenceRepository evidenceRepo;
    private final EvidenceVersionRepository versionRepo;
    private final EvidenceControlMappingRepository mappingRepo;
    private final ControlRepository controlRepo;
    private final ObjectStorageService storage;
    private final AuditService audit;
    private final ObjectMapper mapper;

    public ExportService(ExportJobRepository jobs,
                         EvidenceRepository evidenceRepo,
                         EvidenceVersionRepository versionRepo,
                         EvidenceControlMappingRepository mappingRepo,
                         ControlRepository controlRepo,
                         ObjectStorageService storage,
                         AuditService audit,
                         ObjectMapper mapper) {
        this.jobs = jobs;
        this.evidenceRepo = evidenceRepo;
        this.versionRepo = versionRepo;
        this.mappingRepo = mappingRepo;
        this.controlRepo = controlRepo;
        this.storage = storage;
        this.audit = audit;
        this.mapper = mapper;
    }

    @Transactional
    public ExportJobResponse start() {
        TenantContext.Principal actor = TenantContext.require();
        ExportJob job = jobs.save(new ExportJob(actor.organizationId(), actor.userId()));
        audit.record(actor.organizationId(), actor.userId(),
                AuditEvents.EXPORT_CREATED, "export_job", job.getId(), Map.of());
        buildAsync(job.getId());
        return toResponse(job);
    }

    @Transactional(readOnly = true)
    public ExportJobResponse get(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        return toResponse(jobs.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Export job not found")));
    }

    @Transactional(readOnly = true)
    public byte[] downloadCompleted(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        ExportJob job = jobs.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Export job not found"));
        if (job.getStatus() != ExportJobStatus.COMPLETED || job.getStorageKey() == null) {
            throw new NotFoundException("Export not ready");
        }
        return storage.get(job.getStorageKey());
    }

    @Async("exportExecutor")
    public void buildAsync(UUID jobId) {
        try {
            build(jobId);
        } catch (RuntimeException e) {
            log.error("export job {} failed", jobId, e);
            markFailed(jobId, e.getMessage());
        }
    }

    @Transactional
    protected void build(UUID jobId) {
        ExportJob job = jobs.findById(jobId).orElseThrow();
        UUID orgId = job.getOrganizationId();
        job.setStatus(ExportJobStatus.RUNNING);
        job.setStartedAt(Instant.now());
        jobs.save(job);

        Map<UUID, Control> controlsById = new HashMap<>();
        controlRepo.findAll().forEach(c -> controlsById.put(c.getId(), c));
        Map<UUID, Evidence> evidenceById = new HashMap<>();
        evidenceRepo.findByOrganizationIdOrderByCollectedAtDesc(orgId)
                .forEach(e -> evidenceById.put(e.getId(), e));
        List<EvidenceControlMapping> allMappings = mappingRepo.findByOrganizationId(orgId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(out)) {
            // README
            put(zip, "README.txt", ("Syncpoint SOC 2 Evidence Package\n" +
                    "Generated at: " + Instant.now() + "\n" +
                    "This package contains evidence records and their control mappings.\n" +
                    "The product does NOT determine SOC 2 compliance.\n").getBytes(StandardCharsets.UTF_8));

            // index.csv
            StringBuilder csv = new StringBuilder();
            csv.append("evidence_id,name,source,status,collected_at,mapped_controls,content_hash\n");
            for (Evidence e : evidenceById.values()) {
                List<String> mappedCodes = allMappings.stream()
                        .filter(m -> m.getEvidenceId().equals(e.getId()))
                        .map(m -> controlsById.get(m.getControlId()))
                        .filter(java.util.Objects::nonNull)
                        .map(Control::getCode)
                        .distinct().sorted().toList();
                EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(e.getId()).orElse(null);
                csv.append(String.join(",", List.of(
                        e.getId().toString(),
                        csvQuote(e.getName()),
                        e.getSourceType().name(),
                        e.getStatus().name(),
                        e.getCollectedAt().toString(),
                        String.join(";", mappedCodes),
                        v == null ? "" : v.getContentHash()
                ))).append('\n');
            }
            put(zip, "index.csv", csv.toString().getBytes(StandardCharsets.UTF_8));

            // per-control folders
            for (Control ctrl : controlsById.values()) {
                List<EvidenceControlMapping> ms = allMappings.stream()
                        .filter(m -> m.getControlId().equals(ctrl.getId()))
                        .toList();
                if (ms.isEmpty()) continue;
                String base = "controls/" + ctrl.getCode() + "/";
                Map<String, Object> ctrlDoc = new HashMap<>();
                ctrlDoc.put("controlCode", ctrl.getCode());
                ctrlDoc.put("title", ctrl.getTitle());
                ctrlDoc.put("category", ctrl.getCategory());
                ctrlDoc.put("mappings", ms.stream().map(m -> Map.of(
                        "evidenceId", m.getEvidenceId().toString(),
                        "mappingType", m.getMappingType().name(),
                        "classification", m.getClassification() == null ? "" : m.getClassification().name(),
                        "confidence", m.getConfidence() == null ? "" : m.getConfidence().toString(),
                        "reason", m.getReason() == null ? "" : m.getReason()
                )).toList());
                put(zip, base + "evidence.json", mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(ctrlDoc));

                for (EvidenceControlMapping m : ms) {
                    Evidence e = evidenceById.get(m.getEvidenceId());
                    if (e == null) continue;
                    EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(e.getId()).orElse(null);
                    if (v == null) continue;
                    byte[] content;
                    try {
                        content = storage.get(v.getStorageKey());
                    } catch (RuntimeException ex) {
                        content = ("could not fetch evidence content: " + ex.getMessage()).getBytes(StandardCharsets.UTF_8);
                    }
                    String ext = guessExt(v.getMimeType());
                    put(zip, base + "evidence-files/" + e.getId() + ext, content);
                }
            }

            // audit-log.json — best-effort summary; audit event content is app-internal
            Map<String, Object> auditDoc = Map.of(
                    "organizationId", orgId.toString(),
                    "generatedAt", Instant.now().toString(),
                    "note", "See audit_events table for full history. This file is a placeholder.");
            put(zip, "audit-log.json", mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(auditDoc));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        byte[] zipBytes = out.toByteArray();
        String storageKey = "organizations/" + orgId + "/exports/" + job.getId() + ".zip";
        storage.put(storageKey, zipBytes, "application/zip");

        job.setStorageKey(storageKey);
        job.setSizeBytes((long) zipBytes.length);
        job.setStatus(ExportJobStatus.COMPLETED);
        job.setCompletedAt(Instant.now());
        jobs.save(job);
    }

    @Transactional
    protected void markFailed(UUID jobId, String message) {
        jobs.findById(jobId).ifPresent(job -> {
            job.setStatus(ExportJobStatus.FAILED);
            job.setErrorMessage(message == null ? "unknown" : (message.length() > 500 ? message.substring(0, 500) : message));
            job.setCompletedAt(Instant.now());
            jobs.save(job);
        });
    }

    private static void put(ZipOutputStream zip, String name, byte[] data) throws java.io.IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(data);
        zip.closeEntry();
    }

    private static String guessExt(String mimeType) {
        if (mimeType == null) return "";
        return switch (mimeType) {
            case "application/pdf" -> ".pdf";
            case "text/csv" -> ".csv";
            case "application/json" -> ".json";
            case "text/plain" -> ".txt";
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document" -> ".docx";
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> ".xlsx";
            default -> ".bin";
        };
    }

    private static String csvQuote(String s) {
        if (s == null) return "";
        return '"' + s.replace("\"", "\"\"") + '"';
    }

    private ExportJobResponse toResponse(ExportJob j) {
        return new ExportJobResponse(
                j.getId(), j.getStatus(), j.getSizeBytes(),
                j.getStatus() == ExportJobStatus.COMPLETED
                        ? "/api/v1/exports/" + j.getId() + "/download" : null,
                j.getErrorMessage(), j.getStartedAt(), j.getCompletedAt(), j.getCreatedAt());
    }
}
