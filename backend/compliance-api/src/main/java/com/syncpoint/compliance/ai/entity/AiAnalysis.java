package com.syncpoint.compliance.ai.entity;

import com.syncpoint.compliance.evidence.entity.MappingClassification;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_analysis")
public class AiAnalysis {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "evidence_id", nullable = false, updatable = false)
    private UUID evidenceId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Column(nullable = false, length = 64)
    private String provider;

    @Column(nullable = false, length = 128)
    private String model;

    @Column(name = "prompt_version", nullable = false, length = 64)
    private String promptVersion;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private MappingClassification classification;

    @Column(precision = 4, scale = 3)
    private BigDecimal confidence;

    @Column(columnDefinition = "text")
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> result = new HashMap<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AiAnalysis() {
    }

    public AiAnalysis(UUID organizationId, UUID evidenceId, UUID controlId,
                      String provider, String model, String promptVersion,
                      MappingClassification classification, BigDecimal confidence,
                      String reason, Map<String, Object> result) {
        this.organizationId = organizationId;
        this.evidenceId = evidenceId;
        this.controlId = controlId;
        this.provider = provider;
        this.model = model;
        this.promptVersion = promptVersion;
        this.classification = classification;
        this.confidence = confidence;
        this.reason = reason;
        if (result != null) this.result = result;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (result == null) result = new HashMap<>();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getEvidenceId() { return evidenceId; }
    public UUID getControlId() { return controlId; }
    public String getProvider() { return provider; }
    public String getModel() { return model; }
    public String getPromptVersion() { return promptVersion; }
    public MappingClassification getClassification() { return classification; }
    public BigDecimal getConfidence() { return confidence; }
    public String getReason() { return reason; }
    public Map<String, Object> getResult() { return result; }
    public Instant getCreatedAt() { return createdAt; }
}
