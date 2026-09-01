package com.syncpoint.compliance.collection.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "collection_runs")
public class CollectionRun {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "integration_id", nullable = false, updatable = false)
    private UUID integrationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CollectionRunStatus status;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "triggered_by")
    private UUID triggeredBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public CollectionRun() {
    }

    public CollectionRun(UUID organizationId, UUID integrationId, UUID triggeredBy) {
        this.organizationId = organizationId;
        this.integrationId = integrationId;
        this.triggeredBy = triggeredBy;
        this.status = CollectionRunStatus.QUEUED;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getIntegrationId() { return integrationId; }
    public CollectionRunStatus getStatus() { return status; }
    public void setStatus(CollectionRunStatus status) { this.status = status; }
    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public UUID getTriggeredBy() { return triggeredBy; }
    public Instant getCreatedAt() { return createdAt; }
}
