package com.syncpoint.compliance.policy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "policy_acknowledgments")
public class PolicyAcknowledgment {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", nullable = false, updatable = false)
    private UUID organizationId;

    @Column(name = "policy_id", nullable = false, updatable = false)
    private UUID policyId;

    @Column(name = "policy_version", nullable = false, updatable = false)
    private int policyVersion;

    @Column(name = "attestation_cycle", nullable = false, updatable = false)
    private int attestationCycle;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "acknowledged_at", nullable = false, updatable = false)
    private Instant acknowledgedAt;

    public PolicyAcknowledgment() {
    }

    public PolicyAcknowledgment(UUID organizationId, UUID policyId, int policyVersion, int attestationCycle, UUID userId) {
        this.organizationId = organizationId;
        this.policyId = policyId;
        this.policyVersion = policyVersion;
        this.attestationCycle = attestationCycle;
        this.userId = userId;
    }

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (acknowledgedAt == null) acknowledgedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public UUID getPolicyId() { return policyId; }
    public int getPolicyVersion() { return policyVersion; }
    public int getAttestationCycle() { return attestationCycle; }
    public UUID getUserId() { return userId; }
    public Instant getAcknowledgedAt() { return acknowledgedAt; }
}
