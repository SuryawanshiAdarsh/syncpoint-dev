package com.syncpoint.compliance.auditor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** An auditor's evidence request or review note on a specific control -- the interactive
 *  counterpart to the read-only auditor workspace, closing the traditional PBC-list email loop. */
@Entity
@Table(name = "auditor_requests")
public class AuditorRequest {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private AuditorRequestType type;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AuditorRequestStatus status = AuditorRequestStatus.OPEN;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "resolution_note", columnDefinition = "text")
    private String resolutionNote;

    protected AuditorRequest() {
    }

    public AuditorRequest(UUID organizationId, UUID controlId, AuditorRequestType type, String message, UUID createdBy) {
        this.id = UUID.randomUUID();
        this.organizationId = organizationId;
        this.controlId = controlId;
        this.type = type;
        this.message = message;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public void resolve(UUID resolvedBy, String resolutionNote) {
        this.status = AuditorRequestStatus.RESOLVED;
        this.resolvedBy = resolvedBy;
        this.resolvedAt = Instant.now();
        this.resolutionNote = resolutionNote;
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getControlId() { return controlId; }
    public AuditorRequestType getType() { return type; }
    public String getMessage() { return message; }
    public AuditorRequestStatus getStatus() { return status; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public UUID getResolvedBy() { return resolvedBy; }
    public Instant getResolvedAt() { return resolvedAt; }
    public String getResolutionNote() { return resolutionNote; }
}
