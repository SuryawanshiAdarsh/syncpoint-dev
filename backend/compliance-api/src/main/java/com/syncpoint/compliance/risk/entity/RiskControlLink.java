package com.syncpoint.compliance.risk.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/** Join table: which controls mitigate a given risk. A control can mitigate multiple risks and vice versa. */
@Entity
@Table(name = "risk_control_links")
public class RiskControlLink {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "risk_id", nullable = false, updatable = false)
    private UUID riskId;

    @Column(name = "control_id", nullable = false, updatable = false)
    private UUID controlId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RiskControlLink() {
    }

    public RiskControlLink(UUID organizationId, UUID riskId, UUID controlId) {
        this.id = UUID.randomUUID();
        this.organizationId = organizationId;
        this.riskId = riskId;
        this.controlId = controlId;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getRiskId() { return riskId; }
    public UUID getControlId() { return controlId; }
    public Instant getCreatedAt() { return createdAt; }
}
