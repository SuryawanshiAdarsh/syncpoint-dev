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
@Table(name = "collection_items")
public class CollectionItem {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "run_id", nullable = false, updatable = false)
    private UUID runId;

    @Column(name = "evidence_type", nullable = false, length = 64)
    private String evidenceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CollectionItemStatus status;

    @Column(columnDefinition = "text")
    private String message;

    @Column(name = "evidence_id")
    private UUID evidenceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public CollectionItem() {
    }

    public CollectionItem(UUID organizationId, UUID runId, String evidenceType,
                          CollectionItemStatus status, String message, UUID evidenceId) {
        this.organizationId = organizationId;
        this.runId = runId;
        this.evidenceType = evidenceType;
        this.status = status;
        this.message = message;
        this.evidenceId = evidenceId;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getRunId() { return runId; }
    public String getEvidenceType() { return evidenceType; }
    public CollectionItemStatus getStatus() { return status; }
    public String getMessage() { return message; }
    public UUID getEvidenceId() { return evidenceId; }
    public Instant getCreatedAt() { return createdAt; }
}
