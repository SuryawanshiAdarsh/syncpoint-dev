package com.syncpoint.compliance.risk.entity;

/** Used for both likelihood and impact; combined into a 1-9 risk score (see {@link Risk#score()}). */
public enum RiskLevel {
    LOW(1),
    MEDIUM(2),
    HIGH(3);

    private final int weight;

    RiskLevel(int weight) {
        this.weight = weight;
    }

    public int weight() {
        return weight;
    }
}
