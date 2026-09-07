package com.syncpoint.compliance.policy.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "policy_categories")
public class PolicyCategory {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 64)
    private String name;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected PolicyCategory() {
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
