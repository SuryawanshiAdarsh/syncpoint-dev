package com.syncpoint.compliance.evidence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "evidence_versions")
public class EvidenceVersion {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "evidence_id", nullable = false, updatable = false)
    private UUID evidenceId;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private int version;

    @Column(name = "storage_key", nullable = false, length = 512)
    private String storageKey;

    @Column(name = "content_hash", nullable = false, length = 128)
    private String contentHash;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "mime_type", length = 128)
    private String mimeType;

    @Column(name = "collector_version", length = 64)
    private String collectorVersion;

    @Column(name = "collected_at", nullable = false)
    private Instant collectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public EvidenceVersion() {
    }

    public EvidenceVersion(UUID evidenceId, UUID organizationId, int version, String storageKey,
                           String contentHash, long sizeBytes, String mimeType,
                           String collectorVersion, Instant collectedAt) {
        this.evidenceId = evidenceId;
        this.organizationId = organizationId;
        this.version = version;
        this.storageKey = storageKey;
        this.contentHash = contentHash;
        this.sizeBytes = sizeBytes;
        this.mimeType = mimeType;
        this.collectorVersion = collectorVersion;
        this.collectedAt = collectedAt;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getEvidenceId() { return evidenceId; }
    public UUID getOrganizationId() { return organizationId; }
    public int getVersion() { return version; }
    public String getStorageKey() { return storageKey; }
    public String getContentHash() { return contentHash; }
    public long getSizeBytes() { return sizeBytes; }
    public String getMimeType() { return mimeType; }
    public String getCollectorVersion() { return collectorVersion; }
    public Instant getCollectedAt() { return collectedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
