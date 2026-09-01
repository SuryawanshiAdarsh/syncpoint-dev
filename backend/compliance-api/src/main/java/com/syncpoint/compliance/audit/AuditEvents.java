package com.syncpoint.compliance.audit;

/** Canonical audit event types (PROJECT_SPEC2 §55). */
public final class AuditEvents {

    private AuditEvents() { }

    public static final String LOGIN = "LOGIN";
    public static final String LOGOUT = "LOGOUT";
    public static final String USER_CREATED = "USER_CREATED";
    public static final String USER_ROLE_CHANGED = "USER_ROLE_CHANGED";

    public static final String INTEGRATION_CREATED = "INTEGRATION_CREATED";
    public static final String INTEGRATION_TESTED = "INTEGRATION_TESTED";
    public static final String INTEGRATION_DISCONNECTED = "INTEGRATION_DISCONNECTED";

    public static final String COLLECTION_STARTED = "COLLECTION_STARTED";
    public static final String COLLECTION_COMPLETED = "COLLECTION_COMPLETED";
    public static final String COLLECTION_FAILED = "COLLECTION_FAILED";

    public static final String EVIDENCE_CREATED = "EVIDENCE_CREATED";
    public static final String EVIDENCE_REVIEWED = "EVIDENCE_REVIEWED";
    public static final String EVIDENCE_MAPPED = "EVIDENCE_MAPPED";

    public static final String AI_ANALYSIS_CREATED = "AI_ANALYSIS_CREATED";
    public static final String EXPORT_CREATED = "EXPORT_CREATED";
}
