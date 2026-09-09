package com.syncpoint.compliance.auditor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** The auditor's own record of having tested/sampled a control -- distinct from AuditorRequest
 *  since it isn't something the org resolves, just a Type II artifact of auditor activity. */
@Entity
@Table(name = "auditor_control_reviews")
public class AuditorControlReview {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Column(name = "reviewed_by", nullable = false, updatable = false)
    private UUID reviewedBy;

    @Column(name = "reviewed_at", nullable = false, updatable = false)
    private Instant reviewedAt;

    @Column(columnDefinition = "text")
    private String note;

    protected AuditorControlReview() {
    }

    public AuditorControlReview(UUID organizationId, UUID controlId, UUID reviewedBy, String note) {
        this.id = UUID.randomUUID();
        this.organizationId = organizationId;
        this.controlId = controlId;
        this.reviewedBy = reviewedBy;
        this.note = note;
    }

    @PrePersist
    void onCreate() {
        if (reviewedAt == null) reviewedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getControlId() { return controlId; }
    public UUID getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public String getNote() { return note; }
}
