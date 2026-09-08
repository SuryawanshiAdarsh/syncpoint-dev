package com.syncpoint.compliance.compliance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** A control "failed partway through the period and was remediated" record — the Type II
 *  question distinct from evidence-coverage presence/absence (see ReadinessReportService). */
@Entity
@Table(name = "control_exceptions")
public class ControlException {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "detected_date", nullable = false)
    private LocalDate detectedDate;

    @Column(name = "remediated_date")
    private LocalDate remediatedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private ControlExceptionStatus status = ControlExceptionStatus.OPEN;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ControlException() {
    }

    public ControlException(UUID organizationId, UUID controlId, String description, LocalDate detectedDate, UUID createdBy) {
        this.id = UUID.randomUUID();
        this.organizationId = organizationId;
        this.controlId = controlId;
        this.description = description;
        this.detectedDate = detectedDate;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void remediate(LocalDate remediatedDate) {
        this.remediatedDate = remediatedDate;
        this.status = ControlExceptionStatus.REMEDIATED;
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getControlId() { return controlId; }
    public String getDescription() { return description; }
    public LocalDate getDetectedDate() { return detectedDate; }
    public LocalDate getRemediatedDate() { return remediatedDate; }
    public ControlExceptionStatus getStatus() { return status; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
