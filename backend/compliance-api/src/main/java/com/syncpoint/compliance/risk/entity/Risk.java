package com.syncpoint.compliance.risk.entity;

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

/** A CC3-series risk assessment entry (risk identification + likelihood/impact scoring). */
@Entity
@Table(name = "risks")
public class Risk {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 256)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private RiskCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RiskLevel likelihood;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RiskLevel impact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RiskStatus status = RiskStatus.IDENTIFIED;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;

    @Column(name = "next_review_date")
    private LocalDate nextReviewDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Risk() {
    }

    public Risk(UUID organizationId, String title, String description, RiskCategory category,
                RiskLevel likelihood, RiskLevel impact, UUID ownerUserId, LocalDate nextReviewDate) {
        this.id = UUID.randomUUID();
        this.organizationId = organizationId;
        this.title = title;
        this.description = description;
        this.category = category;
        this.likelihood = likelihood;
        this.impact = impact;
        this.ownerUserId = ownerUserId;
        this.nextReviewDate = nextReviewDate;
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

    /** 1 (low/low) to 9 (high/high); the number auditors and risk registers key off of. */
    public int score() {
        return likelihood.weight() * impact.weight();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public RiskCategory getCategory() { return category; }
    public void setCategory(RiskCategory category) { this.category = category; }
    public RiskLevel getLikelihood() { return likelihood; }
    public void setLikelihood(RiskLevel likelihood) { this.likelihood = likelihood; }
    public RiskLevel getImpact() { return impact; }
    public void setImpact(RiskLevel impact) { this.impact = impact; }
    public RiskStatus getStatus() { return status; }
    public void setStatus(RiskStatus status) { this.status = status; }
    public UUID getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(UUID ownerUserId) { this.ownerUserId = ownerUserId; }
    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate nextReviewDate) { this.nextReviewDate = nextReviewDate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
