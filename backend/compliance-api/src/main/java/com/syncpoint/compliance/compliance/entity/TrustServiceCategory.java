package com.syncpoint.compliance.compliance.entity;

/**
 * AICPA Trust Services Categories. SECURITY is the mandatory baseline every SOC 2 report
 * covers; the others are optional add-ons an organization scopes in explicitly.
 */
public enum TrustServiceCategory {
    SECURITY,
    AVAILABILITY,
    CONFIDENTIALITY,
    PROCESSING_INTEGRITY,
    PRIVACY;

    /**
     * Derives a control's category from its code prefix — no schema change needed on the shared
     * global control catalog. CC* -> Security, A* -> Availability, C* (not CC) -> Confidentiality.
     */
    public static TrustServiceCategory fromControlCode(String code) {
        if (code == null) return SECURITY;
        String upper = code.toUpperCase();
        if (upper.startsWith("CC")) return SECURITY;
        if (upper.startsWith("A")) return AVAILABILITY;
        if (upper.startsWith("C")) return CONFIDENTIALITY;
        if (upper.startsWith("PI")) return PROCESSING_INTEGRITY;
        if (upper.startsWith("P")) return PRIVACY;
        return SECURITY;
    }
}
