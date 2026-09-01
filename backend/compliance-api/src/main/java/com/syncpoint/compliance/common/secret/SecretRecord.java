package com.syncpoint.compliance.common.secret;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "secret_records")
public class SecretRecord {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "organization_id", updatable = false)
    private UUID organizationId;

    @Column(nullable = false, length = 128)
    private String label;

    @Column(nullable = false)
    private byte[] ciphertext;

    @Column(nullable = false)
    private byte[] iv;

    @Column(name = "wrapped_dek", nullable = false)
    private byte[] wrappedDek;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public SecretRecord() {
    }

    public SecretRecord(UUID organizationId, String label, byte[] ciphertext, byte[] iv, byte[] wrappedDek) {
        this.organizationId = organizationId;
        this.label = label;
        this.ciphertext = ciphertext;
        this.iv = iv;
        this.wrappedDek = wrappedDek;
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

    public UUID getId() { return id; }
    public UUID getOrganizationId() { return organizationId; }
    public String getLabel() { return label; }
    public byte[] getCiphertext() { return ciphertext; }
    public byte[] getIv() { return iv; }
    public byte[] getWrappedDek() { return wrappedDek; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
