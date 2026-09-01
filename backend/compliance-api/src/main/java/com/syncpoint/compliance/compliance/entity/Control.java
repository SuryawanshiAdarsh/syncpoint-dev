package com.syncpoint.compliance.compliance.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "controls")
public class Control {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "framework_id", nullable = false, updatable = false)
    private UUID frameworkId;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Control() { }

    public UUID getId() { return id; }
    public UUID getFrameworkId() { return frameworkId; }
    public String getCode() { return code; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCategory() { return category; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
}
