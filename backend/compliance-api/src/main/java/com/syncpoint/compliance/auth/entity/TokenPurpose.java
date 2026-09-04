package com.syncpoint.compliance.auth.entity;

/** What an {@link AuthToken} authorizes the bearer to do once. */
public enum TokenPurpose {
    RESET,
    INVITE,
    VERIFY
}
