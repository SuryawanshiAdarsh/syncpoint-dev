package com.syncpoint.compliance.compliance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Per-organization control ownership. Lives in a join table (not a column on {@link Control})
 * because the control catalog is a shared global reference — an owner column on Control itself
 * would leak one org's assignment into every other org's view of the same control row.
 */
@Entity
@Table(name = "control_owners")
public class ControlOwner {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ControlOwner() {
    }

    public ControlOwner(UUID organizationId, UUID controlId, UUID userId) {
        this.id = UUID.randomUUID();
        this.organizationId = organizationId;
        this.controlId = controlId;
        this.userId = userId;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getControlId() { return controlId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public Instant getCreatedAt() { return createdAt; }
}
