package com.syncpoint.compliance.evidence.entity;

/** Evidence lifecycle status (PROJECT_SPEC §12, §21). */
public enum EvidenceStatus {
    COLLECTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED,
    EXPIRED
}
