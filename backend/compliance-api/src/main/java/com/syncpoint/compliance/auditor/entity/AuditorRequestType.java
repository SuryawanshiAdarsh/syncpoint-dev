package com.syncpoint.compliance.auditor.entity;

/** EVIDENCE_REQUEST: auditor asks the org for more evidence on a control (org resolves it).
 *  REVIEW_NOTE: auditor leaves a note while reviewing, not necessarily requesting anything. */
public enum AuditorRequestType {
    EVIDENCE_REQUEST,
    REVIEW_NOTE
}
