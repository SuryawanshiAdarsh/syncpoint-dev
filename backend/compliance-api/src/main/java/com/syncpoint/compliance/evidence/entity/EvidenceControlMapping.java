package com.syncpoint.compliance.evidence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_control_mappings")
public class EvidenceControlMapping {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "evidence_id", nullable = false, updatable = false)
    private UUID evidenceId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mapping_type", nullable = false, length = 32)
    private MappingType mappingType;

    @Enumerated(EnumType.STRING)
    @Column(length = 32)
    private MappingClassification classification;

    @Column(precision = 4, scale = 3)
    private BigDecimal confidence;

    @Column(columnDefinition = "text")
    private String reason;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public EvidenceControlMapping() {
    }

    public EvidenceControlMapping(UUID organizationId, UUID evidenceId, UUID controlId,
                                  MappingType mappingType, MappingClassification classification,
                                  BigDecimal confidence, String reason, UUID createdBy) {
        this.organizationId = organizationId;
        this.evidenceId = evidenceId;
        this.controlId = controlId;
        this.mappingType = mappingType;
        this.classification = classification;
        this.confidence = confidence;
        this.reason = reason;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getEvidenceId() { return evidenceId; }
    public UUID getControlId() { return controlId; }
    public MappingType getMappingType() { return mappingType; }
    public void setMappingType(MappingType mappingType) { this.mappingType = mappingType; }
    public MappingClassification getClassification() { return classification; }
    public BigDecimal getConfidence() { return confidence; }
    public String getReason() { return reason; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
}
