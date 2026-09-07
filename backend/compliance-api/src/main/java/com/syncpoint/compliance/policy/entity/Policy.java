package com.syncpoint.compliance.policy.entity;

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

@Entity
@Table(name = "policies")
public class Policy {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private PolicyStatus status;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "evidence_id")
    private UUID evidenceId;

    @Column(name = "current_version", nullable = false)
    private int currentVersion;

    @Column(name = "attestation_cycle", nullable = false)
    private int attestationCycle;

    @Column(name = "cycle_started_at", nullable = false)
    private Instant cycleStartedAt;

    @Column(name = "last_reminder_sent_at")
    private Instant lastReminderSentAt;

    @Column(name = "created_by", nullable = false, updatable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public Policy() {
    }

    public Policy(UUID organizationId, String title, String category, String description,
                 UUID evidenceId, UUID createdBy) {
        this.organizationId = organizationId;
        this.title = title;
        this.category = category;
        this.description = description;
        this.status = PolicyStatus.PUBLISHED;
        this.evidenceId = evidenceId;
        this.currentVersion = 1;
        this.attestationCycle = 1;
        this.createdBy = createdBy;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = now;
        if (cycleStartedAt == null) cycleStartedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public PolicyStatus getStatus() { return status; }
    public void setStatus(PolicyStatus status) { this.status = status; }
    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }
    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate nextReviewDate) { this.nextReviewDate = nextReviewDate; }
    public UUID getEvidenceId() { return evidenceId; }
    public int getCurrentVersion() { return currentVersion; }
    public void setCurrentVersion(int currentVersion) { this.currentVersion = currentVersion; }
    public int getAttestationCycle() { return attestationCycle; }
    public void setAttestationCycle(int attestationCycle) { this.attestationCycle = attestationCycle; }
    public Instant getCycleStartedAt() { return cycleStartedAt; }
    public void setCycleStartedAt(Instant cycleStartedAt) { this.cycleStartedAt = cycleStartedAt; }
    public Instant getLastReminderSentAt() { return lastReminderSentAt; }
    public void setLastReminderSentAt(Instant lastReminderSentAt) { this.lastReminderSentAt = lastReminderSentAt; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
