package com.syncpoint.compliance.evidence.service;

import com.syncpoint.compliance.audit.AuditEvents;
import com.syncpoint.compliance.audit.service.AuditService;
import com.syncpoint.compliance.common.exception.ApiException;
import com.syncpoint.compliance.common.exception.ForbiddenException;
import com.syncpoint.compliance.common.exception.NotFoundException;
import com.syncpoint.compliance.common.tenant.TenantContext;
import com.syncpoint.compliance.compliance.entity.Control;
import com.syncpoint.compliance.compliance.repository.ControlRepository;
import com.syncpoint.compliance.evidence.dto.CreateMappingRequest;
import com.syncpoint.compliance.evidence.dto.CreateReviewRequest;
import com.syncpoint.compliance.evidence.dto.EvidenceResponse;
import com.syncpoint.compliance.evidence.dto.MappingResponse;
import com.syncpoint.compliance.evidence.dto.ReviewResponse;
import com.syncpoint.compliance.evidence.entity.Evidence;
import com.syncpoint.compliance.evidence.entity.EvidenceControlMapping;
import com.syncpoint.compliance.evidence.entity.EvidenceReview;
import com.syncpoint.compliance.evidence.entity.EvidenceSourceType;
import com.syncpoint.compliance.evidence.entity.EvidenceStatus;
import com.syncpoint.compliance.evidence.entity.EvidenceVersion;
import com.syncpoint.compliance.evidence.entity.MappingType;
import com.syncpoint.compliance.evidence.repository.EvidenceControlMappingRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceReviewRepository;
import com.syncpoint.compliance.evidence.repository.EvidenceVersionRepository;
import com.syncpoint.compliance.storage.ObjectStorageService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EvidenceService {

    private static final Set<String> ALLOWED_MIME = Set.of(
            "application/pdf",
            "text/csv",
            "application/json",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private static final Set<String> ALLOWED_EXT = Set.of(
            "pdf", "csv", "json", "txt", "docx", "xlsx"
    );
    private static final long MAX_BYTES = 50L * 1024 * 1024;

    private final EvidenceRepository evidenceRepo;
    private final EvidenceVersionRepository versionRepo;
    private final EvidenceControlMappingRepository mappingRepo;
    private final EvidenceReviewRepository reviewRepo;
    private final ControlRepository controlRepo;
    private final ObjectStorageService storage;
    private final AuditService audit;

    public EvidenceService(EvidenceRepository evidenceRepo,
                           EvidenceVersionRepository versionRepo,
                           EvidenceControlMappingRepository mappingRepo,
                           EvidenceReviewRepository reviewRepo,
                           ControlRepository controlRepo,
                           ObjectStorageService storage,
                           AuditService audit) {
        this.evidenceRepo = evidenceRepo;
        this.versionRepo = versionRepo;
        this.mappingRepo = mappingRepo;
        this.reviewRepo = reviewRepo;
        this.controlRepo = controlRepo;
        this.storage = storage;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<EvidenceResponse> list() {
        UUID orgId = TenantContext.require().organizationId();
        List<Evidence> all = evidenceRepo.findByOrganizationIdOrderByCollectedAtDesc(orgId);
        Map<UUID, EvidenceVersion> latest = new HashMap<>();
        for (Evidence e : all) {
            versionRepo.findFirstByEvidenceIdOrderByVersionDesc(e.getId())
                    .ifPresent(v -> latest.put(e.getId(), v));
        }
        return all.stream().map(e -> toResponse(e, latest.get(e.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public EvidenceResponse get(UUID id) {
        Evidence e = requireOwned(id);
        EvidenceVersion v = versionRepo.findFirstByEvidenceIdOrderByVersionDesc(e.getId()).orElse(null);
        return toResponse(e, v);
    }

    @Transactional
    public EvidenceResponse upload(String name, String description, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "File is required");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
                    "File exceeds " + MAX_BYTES + " bytes");
        }
        String ext = extractExt(file.getOriginalFilename());
        if (!ALLOWED_EXT.contains(ext)) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_TYPE",
                    "File extension not allowed: " + ext);
        }
        String mime = file.getContentType();
        // Accept application/octet-stream as "no mime declared"; enforce allowlist otherwise.
        if (mime != null && !mime.isBlank()
                && !mime.equalsIgnoreCase("application/octet-stream")
                && !ALLOWED_MIME.contains(mime)) {
            throw new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_TYPE",
                    "MIME type not allowed: " + mime);
        }
        if (mime == null || mime.isBlank() || mime.equalsIgnoreCase("application/octet-stream")) {
            mime = mimeForExt(ext);
        }

        TenantContext.Principal actor = TenantContext.require();
        Instant now = Instant.now();

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "UPLOAD_FAILED", "Could not read upload");
        }
        String hash = sha256Hex(bytes);

        Evidence evidence = evidenceRepo.save(new Evidence(
                actor.organizationId(),
                trim255(name != null ? name : file.getOriginalFilename()),
                description,
                EvidenceSourceType.MANUAL_UPLOAD,
                "manual-upload",
                EvidenceStatus.COLLECTED,
                now,
                now.plus(365, ChronoUnit.DAYS),
                actor.userId()));

        UUID storageKeyId = UUID.randomUUID();
        String key = storage.buildKey(actor.organizationId(), evidence.getId(), storageKeyId);
        storage.put(key, bytes, mime);

        EvidenceVersion version = versionRepo.save(new EvidenceVersion(
                evidence.getId(), actor.organizationId(), 1, key, hash,
                bytes.length, mime, "manual/1", now));

        audit.record(actor.organizationId(), actor.userId(),
                AuditEvents.EVIDENCE_CREATED, "evidence", evidence.getId(),
                Map.of("source", "MANUAL_UPLOAD", "sizeBytes", bytes.length, "contentHash", hash));

        return toResponse(evidence, version);
    }

    @Transactional
    public MappingResponse createMapping(UUID evidenceId, CreateMappingRequest req) {
        Evidence e = requireOwned(evidenceId);
        Control control = controlRepo.findById(req.controlId())
                .orElseThrow(() -> new NotFoundException("Control not found"));
        UUID actor = TenantContext.require().userId();
        EvidenceControlMapping saved = mappingRepo.save(new EvidenceControlMapping(
                e.getOrganizationId(), e.getId(), control.getId(),
                req.mappingType(), req.classification(), req.confidence(), req.reason(), actor));

        audit.record(e.getOrganizationId(), actor,
                AuditEvents.EVIDENCE_MAPPED, "evidence_control_mapping", saved.getId(),
                Map.of("evidenceId", e.getId().toString(), "controlCode", control.getCode(),
                        "type", req.mappingType().name()));

        return new MappingResponse(saved.getId(), saved.getEvidenceId(), saved.getControlId(),
                control.getCode(), saved.getMappingType(), saved.getClassification(),
                saved.getConfidence(), saved.getReason(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<MappingResponse> listMappings(UUID evidenceId) {
        Evidence e = requireOwned(evidenceId);
        List<EvidenceControlMapping> list = mappingRepo.findByEvidenceIdAndOrganizationId(e.getId(), e.getOrganizationId());
        if (list.isEmpty()) return List.of();
        Map<UUID, String> codes = controlRepo.findAllById(
                list.stream().map(EvidenceControlMapping::getControlId).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(Control::getId, Control::getCode));
        return list.stream().map(m -> new MappingResponse(
                m.getId(), m.getEvidenceId(), m.getControlId(),
                codes.getOrDefault(m.getControlId(), null),
                m.getMappingType(), m.getClassification(), m.getConfidence(), m.getReason(),
                m.getCreatedAt())).toList();
    }

    @Transactional
    public ReviewResponse createReview(UUID evidenceId, CreateReviewRequest req) {
        Evidence e = requireOwned(evidenceId);
        UUID actor = TenantContext.require().userId();
        EvidenceReview saved = reviewRepo.save(new EvidenceReview(
                e.getOrganizationId(), e.getId(), actor, req.decision(), req.comments()));
        e.setStatus(req.decision() == com.syncpoint.compliance.evidence.entity.ReviewDecision.APPROVED
                ? EvidenceStatus.APPROVED : EvidenceStatus.REJECTED);
        evidenceRepo.save(e);

        audit.record(e.getOrganizationId(), actor,
                AuditEvents.EVIDENCE_REVIEWED, "evidence", e.getId(),
                Map.of("decision", req.decision().name()));

        return new ReviewResponse(saved.getId(), saved.getEvidenceId(), saved.getReviewerId(),
                saved.getDecision(), saved.getComments(), saved.getReviewedAt());
    }

    @Transactional
    public void delete(UUID id) {
        Evidence e = requireOwned(id);
        List<EvidenceVersion> versions = versionRepo.findByEvidenceIdOrderByVersionDesc(e.getId());
        for (EvidenceVersion v : versions) {
            try {
                storage.delete(v.getStorageKey());
            } catch (RuntimeException ignore) { /* best-effort delete */ }
        }
        evidenceRepo.delete(e);
    }

    private Evidence requireOwned(UUID id) {
        UUID orgId = TenantContext.require().organizationId();
        return evidenceRepo.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NotFoundException("Evidence not found"));
    }

    private static String trim255(String s) {
        if (s == null) return "unnamed";
        return s.length() > 255 ? s.substring(0, 255) : s;
    }

    private static String extractExt(String filename) {
        if (filename == null) return "";
        int i = filename.lastIndexOf('.');
        if (i < 0 || i == filename.length() - 1) return "";
        return filename.substring(i + 1).toLowerCase();
    }

    private static String mimeForExt(String ext) {
        return switch (ext) {
            case "pdf" -> "application/pdf";
            case "csv" -> "text/csv";
            case "json" -> "application/json";
            case "txt" -> "text/plain";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            default -> "application/octet-stream";
        };
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(data);
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private EvidenceResponse toResponse(Evidence e, EvidenceVersion v) {
        EvidenceResponse.FreshnessState freshness = computeFreshness(e.getExpiresAt());
        return new EvidenceResponse(
                e.getId(), e.getName(), e.getDescription(),
                e.getSourceType(), e.getSourceSystem(), e.getStatus(), freshness,
                e.getCollectedAt(), e.getExpiresAt(),
                v == null ? null : v.getVersion(),
                v == null ? null : v.getContentHash(),
                v == null ? null : v.getSizeBytes(),
                v == null ? null : v.getMimeType(),
                e.getCreatedAt());
    }

    private static EvidenceResponse.FreshnessState computeFreshness(Instant expiresAt) {
        if (expiresAt == null) return EvidenceResponse.FreshnessState.CURRENT;
        Instant now = Instant.now();
        if (expiresAt.isBefore(now)) return EvidenceResponse.FreshnessState.EXPIRED;
        if (expiresAt.isBefore(now.plus(30, ChronoUnit.DAYS))) return EvidenceResponse.FreshnessState.EXPIRING;
        return EvidenceResponse.FreshnessState.CURRENT;
    }
}
