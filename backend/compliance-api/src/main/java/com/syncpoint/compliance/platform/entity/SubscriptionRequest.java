package com.syncpoint.compliance.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** An org's proposed plan/seat change, awaiting platform-admin approval or rejection. */
@Entity
@Table(name = "subscription_requests")
public class SubscriptionRequest {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "requested_by", nullable = false, updatable = false)
    private UUID requestedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_plan", nullable = false, length = 20, updatable = false)
    private SubscriptionPlan requestedPlan;

    @Column(name = "requested_seat_limit", nullable = false, updatable = false)
    private Integer requestedSeatLimit;

    @Column(length = 500, updatable = false)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionRequestStatus status;

    @Column(name = "reviewed_by")
    private UUID reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_note", length = 500)
    private String reviewNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SubscriptionRequest() {
    }

    public SubscriptionRequest(UUID organizationId, UUID requestedBy, SubscriptionPlan requestedPlan,
                                Integer requestedSeatLimit, String note) {
        this.organizationId = organizationId;
        this.requestedBy = requestedBy;
        this.requestedPlan = requestedPlan;
        this.requestedSeatLimit = requestedSeatLimit;
        this.note = note;
        this.status = SubscriptionRequestStatus.PENDING;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void approve(UUID reviewerUserId) {
        this.status = SubscriptionRequestStatus.APPROVED;
        this.reviewedBy = reviewerUserId;
        this.reviewedAt = Instant.now();
    }

    public void reject(UUID reviewerUserId, String reviewNote) {
        this.status = SubscriptionRequestStatus.REJECTED;
        this.reviewedBy = reviewerUserId;
        this.reviewedAt = Instant.now();
        this.reviewNote = reviewNote;
    }

    /** Withdrawn by the requesting org itself, not reviewed by a platform admin. */
    public void cancel() {
        this.status = SubscriptionRequestStatus.CANCELED;
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getRequestedBy() { return requestedBy; }
    public SubscriptionPlan getRequestedPlan() { return requestedPlan; }
    public Integer getRequestedSeatLimit() { return requestedSeatLimit; }
    public String getNote() { return note; }
    public SubscriptionRequestStatus getStatus() { return status; }
    public UUID getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public String getReviewNote() { return reviewNote; }
    public Instant getCreatedAt() { return createdAt; }
}
