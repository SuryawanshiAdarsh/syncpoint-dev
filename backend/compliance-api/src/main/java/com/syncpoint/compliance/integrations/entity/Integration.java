package com.syncpoint.compliance.integrations.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "integrations")
public class Integration {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IntegrationProvider provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IntegrationStatus status;

    @Column(name = "display_name")
    private String displayName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> configuration = new HashMap<>();

    @Column(name = "credential_reference")
    private UUID credentialReference;

    @Column(name = "last_tested_at")
    private Instant lastTestedAt;

    @Column(name = "last_test_message", columnDefinition = "text")
    private String lastTestMessage;

    @Column(name = "last_collection_at")
    private Instant lastCollectionAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private IntegrationSchedule schedule;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Integration() {
    }

    public Integration(UUID organizationId, IntegrationProvider provider, IntegrationStatus status,
                       String displayName, Map<String, Object> configuration,
                       IntegrationSchedule schedule, UUID createdBy) {
        this.organizationId = organizationId;
        this.provider = provider;
        this.status = status;
        this.displayName = displayName;
        if (configuration != null) this.configuration = configuration;
        this.schedule = schedule == null ? IntegrationSchedule.MANUAL : schedule;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
        if (configuration == null) configuration = new HashMap<>();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public IntegrationProvider getProvider() { return provider; }
    public IntegrationStatus getStatus() { return status; }
    public void setStatus(IntegrationStatus status) { this.status = status; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public Map<String, Object> getConfiguration() { return configuration; }
    public void setConfiguration(Map<String, Object> configuration) { this.configuration = configuration; }
    public UUID getCredentialReference() { return credentialReference; }
    public void setCredentialReference(UUID credentialReference) { this.credentialReference = credentialReference; }
    public Instant getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(Instant lastTestedAt) { this.lastTestedAt = lastTestedAt; }
    public String getLastTestMessage() { return lastTestMessage; }
    public void setLastTestMessage(String lastTestMessage) { this.lastTestMessage = lastTestMessage; }
    public Instant getLastCollectionAt() { return lastCollectionAt; }
    public void setLastCollectionAt(Instant lastCollectionAt) { this.lastCollectionAt = lastCollectionAt; }
    public IntegrationSchedule getSchedule() { return schedule; }
    public void setSchedule(IntegrationSchedule schedule) { this.schedule = schedule; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
