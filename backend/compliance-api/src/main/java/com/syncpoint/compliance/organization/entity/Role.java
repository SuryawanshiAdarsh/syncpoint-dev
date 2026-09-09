package com.syncpoint.compliance.organization.entity;

/** ACKNOWLEDGER is deliberately minimal: real login (see SecurityConfig), no access beyond
 *  /api/v1/my-policies/** and /api/v1/auth/me -- for people who only need to acknowledge
 *  policies, not use the rest of the compliance app.
 *  AUDITOR is the same shape of restriction, scoped to /api/v1/auditor/** instead -- a real login
 *  for an invited CPA firm member, read-only plus evidence-request/review actions, time-boxed via
 *  OrganizationMember.accessExpiresAt. */
public enum Role {
    OWNER,
    ADMIN,
    REVIEWER,
    VIEWER,
    ACKNOWLEDGER,
    AUDITOR
}
