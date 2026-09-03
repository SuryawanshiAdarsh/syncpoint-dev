package com.syncpoint.compliance.compliance.entity;

import com.syncpoint.compliance.compliance.dto.ControlStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** One row per (org, control, day) — the daily fact a coverage-trend chart is built from. */
@Entity
@Table(name = "control_status_snapshots")
public class ControlStatusSnapshot {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ControlStatus status;

    @Column(name = "snapshot_date", nullable = false, updatable = false)
    private LocalDate snapshotDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected ControlStatusSnapshot() {
    }

    public ControlStatusSnapshot(UUID organizationId, UUID controlId, ControlStatus status, LocalDate snapshotDate) {
        this.organizationId = organizationId;
        this.controlId = controlId;
        this.status = status;
        this.snapshotDate = snapshotDate;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getControlId() { return controlId; }
    public ControlStatus getStatus() { return status; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public Instant getCreatedAt() { return createdAt; }
}
