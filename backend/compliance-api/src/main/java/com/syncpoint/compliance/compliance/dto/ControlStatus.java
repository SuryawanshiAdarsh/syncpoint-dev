package com.syncpoint.compliance.compliance.dto;

/** Control evidence-readiness status (PROJECT_SPEC2 §27). Not a legal determination. */
public enum ControlStatus {
    COVERED,
    PARTIAL,
    MISSING,
    NEEDS_REVIEW
}
