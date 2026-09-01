package com.syncpoint.compliance.evidence.entity;

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
@Table(name = "evidence_reviews")
public class EvidenceReview {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "evidence_id", nullable = false, updatable = false)
    private UUID evidenceId;

    @Column(name = "reviewer_id")
    private UUID reviewerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewDecision decision;

    @Column(columnDefinition = "text")
    private String comments;

    @Column(name = "reviewed_at", nullable = false, updatable = false)
    private Instant reviewedAt;

    public EvidenceReview() {
    }

    public EvidenceReview(UUID organizationId, UUID evidenceId, UUID reviewerId,
                          ReviewDecision decision, String comments) {
        this.organizationId = organizationId;
        this.evidenceId = evidenceId;
        this.reviewerId = reviewerId;
        this.decision = decision;
        this.comments = comments;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (reviewedAt == null) reviewedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getEvidenceId() { return evidenceId; }
    public UUID getReviewerId() { return reviewerId; }
    public ReviewDecision getDecision() { return decision; }
    public String getComments() { return comments; }
    public Instant getReviewedAt() { return reviewedAt; }
}
