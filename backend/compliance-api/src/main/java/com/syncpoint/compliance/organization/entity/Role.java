package com.syncpoint.compliance.organization.entity;

/** ACKNOWLEDGER is deliberately minimal: real login (see SecurityConfig), no access beyond
 *  /api/v1/my-policies/** and /api/v1/auth/me -- for people who only need to acknowledge
 *  policies, not use the rest of the compliance app. */
public enum Role {
    OWNER,
    ADMIN,
    REVIEWER,
    VIEWER,
    ACKNOWLEDGER
}
