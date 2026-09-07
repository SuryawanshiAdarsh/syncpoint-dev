package com.syncpoint.compliance.export.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.auth.entity.User;
import com.syncpoint.compliance.auth.repository.UserRepository;
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
import com.syncpoint.compliance.organization.entity.OrganizationMember;
import com.syncpoint.compliance.organization.repository.OrganizationMemberRepository;
import com.syncpoint.compliance.policy.entity.Policy;
import com.syncpoint.compliance.policy.entity.PolicyAcknowledgment;
import com.syncpoint.compliance.policy.entity.PolicyStatus;
import com.syncpoint.compliance.policy.repository.PolicyAcknowledgmentRepository;
import com.syncpoint.compliance.policy.repository.PolicyRepository;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
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
    private final PolicyRepository policyRepo;
    private final PolicyAcknowledgmentRepository policyAckRepo;
    private final OrganizationMemberRepository memberRepo;
    private final UserRepository userRepo;
    private final ObjectStorageService storage;
    private final AuditService audit;
    private final ObjectMapper mapper;

    public ExportService(ExportJobRepository jobs,
                         EvidenceRepository evidenceRepo,
                         EvidenceVersionRepository versionRepo,
                         EvidenceControlMappingRepository mappingRepo,
                         ControlRepository controlRepo,
                         PolicyRepository policyRepo,
                         PolicyAcknowledgmentRepository policyAckRepo,
                         OrganizationMemberRepository memberRepo,
                         UserRepository userRepo,
                         ObjectStorageService storage,
                         AuditService audit,
                         ObjectMapper mapper) {
        this.jobs = jobs;
        this.evidenceRepo = evidenceRepo;
        this.versionRepo = versionRepo;
        this.mappingRepo = mappingRepo;
        this.controlRepo = controlRepo;
        this.policyRepo = policyRepo;
        this.policyAckRepo = policyAckRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
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
                    "This package contains evidence records and their control mappings, plus\n" +
                    "a policies/ section with published policy documents and employee\n" +
                    "acknowledgment rosters.\n" +
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

            // policies/ — published policy documents + acknowledgment rosters
            List<Policy> policies = policyRepo.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .filter(p -> p.getStatus() == PolicyStatus.PUBLISHED)
                    .toList();
            if (!policies.isEmpty()) {
                List<PolicyAcknowledgment> allAcks = policyAckRepo.findByOrganizationId(orgId);
                List<OrganizationMember> members = memberRepo.findByOrganizationIdOrderByCreatedAtAsc(orgId);
                Set<UUID> userIds = new HashSet<>();
                members.forEach(m -> userIds.add(m.getUserId()));
                policies.forEach(p -> { if (p.getOwnerUserId() != null) userIds.add(p.getOwnerUserId()); });
                Map<UUID, User> usersById = userIds.isEmpty() ? Map.of() :
                        userRepo.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

                StringBuilder policyCsv = new StringBuilder();
                policyCsv.append("policy_id,title,category,owner,current_version,mapped_controls,acknowledged,next_review_date\n");

                for (Policy p : policies) {
                    List<String> mappedCodes = allMappings.stream()
                            .filter(m -> p.getEvidenceId() != null && m.getEvidenceId().equals(p.getEvidenceId()))
                            .map(m -> controlsById.get(m.getControlId()))
                            .filter(java.util.Objects::nonNull)
                            .map(Control::getCode).distinct().sorted().toList();

                    List<PolicyAcknowledgment> currentAcks = allAcks.stream()
                            .filter(a -> a.getPolicyId().equals(p.getId()) && a.getPolicyVersion() == p.getCurrentVersion())
                            .toList();

                    User owner = p.getOwnerUserId() == null ? null : usersById.get(p.getOwnerUserId());
                    policyCsv.append(String.join(",", List.of(
                            p.getId().toString(),
                            csvQuote(p.getTitle()),
                            csvQuote(p.getCategory()),
                            csvQuote(owner == null ? "" : owner.getName()),
                            String.valueOf(p.getCurrentVersion()),
                            String.join(";", mappedCodes),
                            currentAcks.size() + "/" + members.size(),
                            p.getNextReviewDate() == null ? "" : p.getNextReviewDate().toString()
                    ))).append('\n');

                    String base = "policies/" + p.getId() + "/";

                    if (p.getEvidenceId() != null) {
                        EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(p.getEvidenceId()).orElse(null);
                        if (v != null) {
                            byte[] content;
                            try {
                                content = storage.get(v.getStorageKey());
                            } catch (RuntimeException ex) {
                                content = ("could not fetch policy document: " + ex.getMessage()).getBytes(StandardCharsets.UTF_8);
                            }
                            put(zip, base + "document" + guessExt(v.getMimeType()), content);
                        }
                    }

                    List<Map<String, Object>> roster = members.stream().map(m -> {
                        User u = usersById.get(m.getUserId());
                        PolicyAcknowledgment ack = currentAcks.stream()
                                .filter(a -> a.getUserId().equals(m.getUserId())).findFirst().orElse(null);
                        Map<String, Object> row = new HashMap<>();
                        row.put("userId", m.getUserId().toString());
                        row.put("name", u == null ? "" : u.getName());
                        row.put("email", u == null ? "" : u.getEmail());
                        row.put("acknowledgedAt", ack == null ? null : ack.getAcknowledgedAt().toString());
                        return row;
                    }).toList();
                    put(zip, base + "acknowledgments.json", mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(roster));
                }

                put(zip, "policies/index.csv", policyCsv.toString().getBytes(StandardCharsets.UTF_8));
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
